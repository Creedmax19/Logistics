-- Enable Row Level Security
alter table if exists public.blogs enable row level security;
alter table if exists public.blog_categories enable row level security;
alter table if exists public.blog_authors enable row level security;

-- Create blog categories table
create table if not exists public.blog_categories (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    slug text not null unique,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create blog authors table
create table if not exists public.blog_authors (
    id uuid references auth.users on delete cascade not null primary key,
    display_name text,
    bio text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create blogs table
create table if not exists public.blogs (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    slug text not null unique,
    excerpt text,
    content text not null,
    cover_image text,
    category_id uuid references public.blog_categories(id) on delete set null,
    author_id uuid references public.blog_authors(id) on delete set null,
    is_published boolean default false,
    published_at timestamp with time zone,
    meta_title text,
    meta_description text,
    meta_keywords text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index idx_blogs_slug on public.blogs(slug);
create index idx_blogs_published on public.blogs(published_at) where is_published = true;
create index idx_blogs_author on public.blogs(author_id);
create index idx_blogs_category on public.blogs(category_id);

-- Set up RLS policies
-- Blog Categories
create policy "Enable read access for all users" 
on public.blog_categories for select 
using (true);

create policy "Enable insert for authenticated users only"
on public.blog_categories for insert
with check (auth.role() = 'authenticated');

-- Blog Authors
create policy "Enable read access for all users"
on public.blog_authors for select
using (true);

create policy "Users can update their own author profile"
on public.blog_authors for update
using (auth.uid() = id);

-- Blogs
create policy "Enable read access for published blogs"
on public.blogs for select
using (is_published = true or auth.uid() = author_id);

create policy "Enable insert for authenticated users only"
on public.blogs for insert
with check (auth.role() = 'authenticated');

create policy "Enable update for blog authors"
on public.blogs for update
using (auth.uid() = author_id);

-- Create function to update updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create or replace trigger handle_blog_updated_at
before update on public.blogs
for each row
execute function public.handle_updated_at();

create or replace trigger handle_category_updated_at
before update on public.blog_categories
for each row
execute function public.handle_updated_at();

create or replace trigger handle_author_updated_at
before update on public.blog_authors
for each row
execute function public.handle_updated_at();

-- Insert some default categories
insert into public.blog_categories (name, slug, description)
values 
    ('Cleaning Tips', 'cleaning-tips', 'Helpful tips and tricks for keeping your space clean'),
    ('Company News', 'company-news', 'Latest updates and news from our company'),
    ('Eco-Friendly Living', 'eco-friendly', 'Tips for living a more sustainable lifestyle'),
    ('Moving Guide', 'moving-guide', 'Helpful guides for moving and relocation');

-- Create a function to create an author profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.blog_authors (id, display_name)
    values (new.id, new.raw_user_meta_data->>'full_name');
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger to create author profile on user signup
create or replace trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
