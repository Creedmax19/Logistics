// Import Supabase functions
import { submitContactForm, saveUserPreferences, getUserPreferences } from './lib/supabase.js';

// Generate or get session ID for anonymous users
function getSessionId() {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}

// Initialize session
const sessionId = getSessionId();

// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

// Language Toggle Functionality
let currentLanguage = 'en';
const languageBtn = document.getElementById('languageBtn');
const flagSpan = languageBtn.querySelector('.flag');
const langTextSpan = languageBtn.querySelector('.lang-text');

async function updateLanguage(lang) {
    currentLanguage = lang;
    
    // Update button appearance
    if (lang === 'de') {
        flagSpan.textContent = '🇩🇪';
        langTextSpan.textContent = 'DE';
    } else {
        flagSpan.textContent = '🇺🇸';
        langTextSpan.textContent = 'EN';
    }
    
    // Update all translatable elements
    const translatableElements = document.querySelectorAll('[data-en][data-de]');
    translatableElements.forEach(element => {
        const translation = element.getAttribute(`data-${lang}`);
        if (translation) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        }
    });
    
    // Update document title
    const titleElement = document.querySelector('title');
    if (titleElement) {
        const titleTranslation = titleElement.getAttribute(`data-${lang}`);
        if (titleTranslation) {
            titleElement.textContent = titleTranslation;
        }
    }
    
    // Update form placeholders
    const placeholderElements = document.querySelectorAll(`[data-${lang}-placeholder]`);
    placeholderElements.forEach(element => {
        const placeholder = element.getAttribute(`data-${lang}-placeholder`);
        if (placeholder) {
            element.placeholder = placeholder;
        }
    });
    
    // Store language preference
    localStorage.setItem('preferredLanguage', lang);
    
    // Save to Supabase
    await saveUserPreferences(sessionId, { language: lang });
}


languageBtn.addEventListener('click', () => {
    const newLanguage = currentLanguage === 'en' ? 'de' : 'en';
    updateLanguage(newLanguage);
});

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Navbar scroll effect
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.offsetTop;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Contact form handling
const contactForm = document.getElementById('contactForm');

// Video Play Button Functionality
document.querySelectorAll('.video-card').forEach(card => {
    const video = card.querySelector('video');
    const playBtn = card.querySelector('.play-btn');
    const overlay = card.querySelector('.video-overlay');
    
    playBtn.addEventListener('click', () => {
        video.play();
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
    });
    
    video.addEventListener('pause', () => {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
    });
    
    video.addEventListener('ended', () => {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
    });
});

contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(contactForm);
    const formObject = {};
    
    formData.forEach((value, key) => {
        formObject[key] = value;
    });
    
    // Add current language to form data
    formObject.language = currentLanguage;
    
    // Simulate form submission
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    const sendingText = currentLanguage === 'de' ? 'Wird gesendet...' : 'Sending...';
    submitButton.textContent = sendingText;
    submitButton.disabled = true;
    
    try {
        // Submit to Supabase
        const result = await submitContactForm(formObject);
        
        if (result.success) {
            const thankYouMessage = currentLanguage === 'de' 
                ? 'Vielen Dank für Ihre Nachricht! Wir melden uns innerhalb von 24 Stunden bei Ihnen.'
                : 'Thank you for your message! We\'ll get back to you within 24 hours.';
            alert(thankYouMessage);
            contactForm.reset();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Form submission error:', error);
        const thankYouMessage = currentLanguage === 'de' 
            ? 'Es gab einen Fehler beim Senden Ihrer Nachricht. Bitte versuchen Sie es später erneut.'
            : 'There was an error sending your message. Please try again later.';
        alert(thankYouMessage);
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationDelay = '0.3s';
            entry.target.style.animationFillMode = 'both';
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.service-card, .video-card, .feature, .contact-item').forEach(el => {
    observer.observe(el);
});

// Add CSS for scroll animations
const style = document.createElement('style');
style.textContent = `
    .service-card,
    .video-card,
    .feature,
    .contact-item {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .service-card.animate,
    .video-card.animate,
    .feature.animate,
    .contact-item.animate {
        opacity: 1;
        transform: translateY(0);
    }
    
    .service-card:nth-child(2).animate {
        animation-delay: 0.2s;
    }
    
    .service-card:nth-child(3).animate {
        animation-delay: 0.4s;
    }
    
    .service-card:nth-child(4).animate {
        animation-delay: 0.6s;
    }
`;
document.head.appendChild(style);

// Counter animation for hero stats
function animateCounter(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        
        if (element.textContent.includes('+')) {
            element.textContent = value + '+';
        } else if (element.textContent.includes('★')) {
            element.textContent = (value / 100).toFixed(1) + '★';
        } else if (element.textContent.includes('%')) {
            element.textContent = value + '%';
        } else {
            element.textContent = value;
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Trigger counter animation when hero section is visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = document.querySelectorAll('.stat-number');
            
            setTimeout(() => {
                animateCounter(statNumbers[0], 0, 500, 2000); // 500+
                animateCounter(statNumbers[1], 0, 100, 2000);  // 100%
                animateCounter(statNumbers[2], 0, 500, 2000);  // 5.0★ (500/100 = 5.0)
            }, 500);
            
            heroObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroSection = document.querySelector('.hero');
if (heroSection) {
    heroObserver.observe(heroSection);
}

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Add smooth hover effects for service cards
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroImage = document.querySelector('.hero-image img');
    
    if (heroImage && scrolled < window.innerHeight) {
        heroImage.style.transform = `translateY(${scrolled * 0.2}px)`;
    }
});

// Form validation enhancements
const formInputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');

formInputs.forEach(input => {
    input.addEventListener('blur', function() {
        if (this.value.trim() === '' && this.hasAttribute('required')) {
            this.style.borderColor = 'var(--error)';
        } else {
            this.style.borderColor = 'var(--success)';
        }
    });
    
    input.addEventListener('focus', function() {
        this.style.borderColor = 'var(--primary-green)';
    });
});

// Add typing effect to hero title
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing effect after a delay
setTimeout(() => {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        typeWriter(heroTitle, originalText, 50);
    }
}, 1000);

// Add scroll progress indicator
const scrollProgress = document.createElement('div');
scrollProgress.className = 'scroll-progress';
scrollProgress.style.cssText = `
    position: fixed;
    top: 80px;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-green), var(--secondary-green));
    z-index: 1000;
    transition: width 0.1s ease-out;
`;
document.body.appendChild(scrollProgress);

window.addEventListener('scroll', () => {
    const scrolled = document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = (scrolled / maxScroll) * 100;
    scrollProgress.style.width = scrollPercent + '%';
});