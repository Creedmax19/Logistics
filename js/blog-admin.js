// Initialize Supabase client
const SUPABASE_URL = 'https://vrzsuleuemufvibsrklz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyenN1bGV1ZW11ZnZpYnNya2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNjQ0MzMsImV4cCI6MjA2ODg0MDQzM30.2PHSqbeEAa8yobgeT6wcU87BCyLdp1N40Kp80lwylGU';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const adminSection = document.getElementById('admin');
const blogSection = document.getElementById('blog');
const postsTableBody = document.getElementById('postsTableBody');
const newPostBtn = document.getElementById('newPostBtn');
const logoutBtn = document.getElementById('logoutBtn');
const postModal = document.getElementById('postModal');
const postForm = document.getElementById('postForm');
const closeModalBtn = document.querySelector('.close-modal');
const cancelPostBtn = document.getElementById('cancelPost');
const modalTitle = document.getElementById('modalTitle');

// State
let isEditing = false;
let currentPostId = null;

// Initialize the application
async function initApp() {
    // Check authentication status
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // User is logged in, show admin section
        showAdminSection();
        loadBlogPosts();
    } else {
        // User is not logged in, show public blog
        loadPublicBlogPosts();
    }
    
    // Setup event listeners
    setupEventListeners();
}

// Show admin section and hide public blog
function showAdminSection() {
    adminSection.style.display = 'block';
    if (blogSection) blogSection.style.display = 'none';
}

// Load blog posts for admin
async function loadBlogPosts() {
    try {
        const { data: posts, error } = await supabase
            .from('blogs')
            .select(`
                *,
                blog_categories (name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        renderPostsTable(posts);
    } catch (error) {
        console.error('Error loading blog posts:', error);
        showNotification('Error loading blog posts', 'error');
    }
}

// Load public blog posts
async function loadPublicBlogPosts() {
    try {
        const { data: posts, error } = await supabase
            .from('blogs')
            .select(`
                *,
                blog_categories (name),
                blog_authors (display_name)
            `)
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .limit(3);

        if (error) throw error;
        
        if (blogSection && posts) {
            renderBlogPosts(posts);
        }
    } catch (error) {
        console.error('Error loading public blog posts:', error);
    }
}

// Render posts in admin table
function renderPostsTable(posts) {
    if (!posts || posts.length === 0) {
        postsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    No blog posts found. Create your first post!
                </td>
            </tr>
        `;
        return;
    }
    
    postsTableBody.innerHTML = posts.map(post => `
        <tr>
            <td>${post.title}</td>
            <td>${post.blog_categories?.name || 'Uncategorized'}</td>
            <td>
                <span class="status-badge status-${post.status}">
                    ${post.status}
                </span>
            </td>
            <td>${new Date(post.updated_at).toLocaleDateString()}</td>
            <td class="actions">
                <button class="btn-action edit-post" data-id="${post.id}">
                    <i class="fas fa-edit"></i>
                    <span data-en="Edit" data-de="Bearbeiten">Edit</span>
                </button>
                <button class="btn-action delete delete-post" data-id="${post.id}">
                    <i class="fas fa-trash"></i>
                    <span data-en="Delete" data-de="Löschen">Delete</span>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const postId = e.currentTarget.getAttribute('data-id');
            editPost(postId);
        });
    });
    
    document.querySelectorAll('.delete-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const postId = e.currentTarget.getAttribute('data-id');
            deletePost(postId);
        });
    });
}

// Render blog posts on public page
function renderBlogPosts(posts) {
    const blogGrid = document.getElementById('blog-posts');
    if (!blogGrid) return;
    
    if (!posts || posts.length === 0) {
        blogGrid.innerHTML = `
            <div class="no-posts">
                <p data-en="No blog posts available." data-de="Keine Blogbeiträge verfügbar.">
                    No blog posts available.
                </p>
            </div>
        `;
        return;
    }
    
    blogGrid.innerHTML = posts.map(post => `
        <article class="blog-card">
            ${post.cover_image ? `
                <img src="${post.cover_image}" alt="${post.title}" class="blog-image">
            ` : ''}
            <div class="blog-content">
                ${post.blog_categories?.name ? `
                    <span class="blog-category">${post.blog_categories.name}</span>
                ` : ''}
                <h3 class="blog-title">${post.title}</h3>
                <p class="blog-excerpt">${post.excerpt || ''}</p>
                <div class="blog-meta">
                    <span class="blog-date">
                        ${new Date(post.published_at).toLocaleDateString()}
                    </span>
                    ${post.blog_authors?.display_name ? `
                        <span class="blog-author">
                            ${post.blog_authors.display_name}
                        </span>
                    ` : ''}
                </div>
                <a href="/blog/${post.slug}" class="btn btn-outline btn-small" style="margin-top: 1rem;">
                    <span data-en="Read More" data-de="Weiterlesen">Read More</span>
                </a>
            </div>
        </article>
    `).join('');
}

// Open modal for new post
function openNewPostModal() {
    isEditing = false;
    currentPostId = null;
    modalTitle.textContent = 'New Blog Post';
    postForm.reset();
    document.getElementById('postStatus').value = 'draft';
    
    // Load categories
    loadCategories();
    
    // Show modal
    postModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Edit existing post
async function editPost(postId) {
    try {
        const { data: post, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('id', postId)
            .single();
            
        if (error) throw error;
        
        if (post) {
            isEditing = true;
            currentPostId = postId;
            modalTitle.textContent = 'Edit Blog Post';
            
            // Fill form with post data
            document.getElementById('postTitle').value = post.title;
            document.getElementById('postExcerpt').value = post.excerpt || '';
            document.getElementById('postContent').value = post.content;
            document.getElementById('postImage').value = post.cover_image || '';
            document.getElementById('postStatus').value = post.status;
            
            // Load categories and set selected
            await loadCategories(post.category_id);
            
            // Show modal
            postModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    } catch (error) {
        console.error('Error editing post:', error);
        showNotification('Error loading post for editing', 'error');
    }
}

// Load categories into select
async function loadCategories(selectedId = null) {
    const categorySelect = document.getElementById('postCategory');
    
    try {
        const { data: categories, error } = await supabase
            .from('blog_categories')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        // Clear existing options except the first one
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }
        
        // Add categories to select
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            if (selectedId && category.id === selectedId) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Save or update post
async function savePost(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('postTitle').value.trim(),
        excerpt: document.getElementById('postExcerpt').value.trim(),
        content: document.getElementById('postContent').value.trim(),
        cover_image: document.getElementById('postImage').value.trim(),
        status: document.getElementById('postStatus').value,
        category_id: document.getElementById('postCategory').value || null,
        slug: document.getElementById('postTitle').value.trim()
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
    };
    
    // Validate required fields
    if (!formData.title || !formData.content) {
        showNotification('Title and content are required', 'error');
        return;
    }
    
    try {
        if (isEditing && currentPostId) {
            // Update existing post
            const { error } = await supabase
                .from('blogs')
                .update({
                    ...formData,
                    updated_at: new Date()
                })
                .eq('id', currentPostId);
                
            if (error) throw error;
            
            showNotification('Post updated successfully', 'success');
        } else {
            // Create new post
            const { data: { user } } = await supabase.auth.getUser();
            
            const { error } = await supabase
                .from('blogs')
                .insert([{
                    ...formData,
                    author_id: user.id,
                    published_at: formData.status === 'published' ? new Date() : null
                }]);
                
            if (error) throw error;
            
            showNotification('Post created successfully', 'success');
        }
        
        // Close modal and refresh posts
        closeModal();
        loadBlogPosts();
    } catch (error) {
        console.error('Error saving post:', error);
        showNotification('Error saving post', 'error');
    }
}

// Delete post
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('blogs')
            .delete()
            .eq('id', postId);
            
        if (error) throw error;
        
        showNotification('Post deleted successfully', 'success');
        loadBlogPosts();
    } catch (error) {
        console.error('Error deleting post:', error);
        showNotification('Error deleting post', 'error');
    }
}

// Close modal
function closeModal() {
    postModal.classList.remove('show');
    document.body.style.overflow = '';
    postForm.reset();
}

// Show notification
function showNotification(message, type = 'info') {
    // You can implement a more sophisticated notification system
    alert(`${type.toUpperCase()}: ${message}`);
}

// Setup event listeners
function setupEventListeners() {
    // New post button
    if (newPostBtn) {
        newPostBtn.addEventListener('click', openNewPostModal);
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.reload();
        });
    }
    
    // Close modal buttons
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (cancelPostBtn) {
        cancelPostBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === postModal) {
            closeModal();
        }
    });
    
    // Form submission
    if (postForm) {
        postForm.addEventListener('submit', savePost);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
