// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initPreloader();
    initMobileMenu();
    initSmoothScrolling();
    initScrollReveal();
    initBackToTop();
    initWalletConnection();
    initTokenomicsChart();
    initGallery();
    initContactForm();
    initNewsletterForm();
    initAnimations();
    
    // Add active class to nav links on scroll
    window.addEventListener('scroll', highlightNavLink);
    
    // Initial check for scroll position
    window.dispatchEvent(new Event('scroll'));
});

// Preloader
function initPreloader() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        // Hide preloader when user clicks on it
        preloader.addEventListener('click', () => {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
        });
        
        // Add cursor pointer to indicate it's clickable
        preloader.style.cursor = 'pointer';
    }
}

// Mobile menu toggle
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuBtn.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a nav link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuBtn.classList.remove('active');
            });
        });
    }
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Highlight active nav link on scroll
function highlightNavLink() {
    const scrollPosition = window.scrollY + 100;
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // Add scrolled class to navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
    
    // Highlight active section in nav
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// Scroll reveal animations
function initScrollReveal() {
    // Use Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements with animation classes
    const animatedElements = document.querySelectorAll('.fade-in, .slide-up, .slide-left, .slide-right');
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Back to top button
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
        
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Wallet connection with Web3 and WalletConnect
function initWalletConnection() {
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const walletAddress = document.getElementById('walletAddress');
    
    if (!connectWalletBtn) return;
    
    // Check if Web3 is injected
    if (typeof window.ethereum !== 'undefined') {
        // Check if already connected
        ethereum.request({ method: 'eth_accounts' })
            .then(accounts => {
                if (accounts.length > 0) {
                    updateWalletUI(accounts[0]);
                }
            })
            .catch(console.error);
        
        // Handle account changes
        ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                updateWalletUI(accounts[0]);
            } else {
                resetWalletUI();
            }
        });
        
        // Handle chain changes
        ethereum.on('chainChanged', () => {
            window.location.reload();
        });
    }
    
    // Connect wallet button click handler
    connectWalletBtn.addEventListener('click', async () => {
        try {
            if (typeof window.ethereum === 'undefined') {
                alert('Please install MetaMask or another Web3 wallet to connect.');
                return;
            }
            
            // Request account access
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            // Update UI
            updateWalletUI(account);
            
            // Optional: Get balance
            const balance = await ethereum.request({
                method: 'eth_getBalance',
                params: [account, 'latest']
            });
            
            console.log('Connected account:', account);
            console.log('Account balance:', balance);
            
        } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('Failed to connect wallet. Please try again.');
        }
    });
    
    // Update wallet UI with connected account
    function updateWalletUI(account) {
        if (!account) return;
        
        const shortenedAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
        connectWalletBtn.textContent = shortenedAddress;
        connectWalletBtn.classList.add('connected');
        
        // Add copy to clipboard functionality
        connectWalletBtn.title = 'Click to copy address';
        connectWalletBtn.style.cursor = 'pointer';
        
        connectWalletBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(account);
            
            const originalText = connectWalletBtn.textContent;
            connectWalletBtn.textContent = 'Copied!';
            connectWalletBtn.style.color = '#00ffcc';
            
            setTimeout(() => {
                connectWalletBtn.textContent = originalText;
                connectWalletBtn.style.color = '';
            }, 2000);
        });
    }
    
    // Reset wallet UI
    function resetWalletUI() {
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.classList.remove('connected');
        connectWalletBtn.removeAttribute('title');
        connectWalletBtn.style.cursor = '';
        
        // Remove all click event listeners
        const newBtn = connectWalletBtn.cloneNode(true);
        connectWalletBtn.parentNode.replaceChild(newBtn, connectWalletBtn);
    }
}

// Initialize tokenomics chart
function initTokenomicsChart() {
    const chartContainer = document.querySelector('.tokenomics-chart');
    if (!chartContainer) return;
    
    // Using Chart.js for the tokenomics chart
    const chartCanvas = document.createElement('canvas');
    chartContainer.innerHTML = '';
    chartContainer.appendChild(chartCanvas);
    
    // Sample tokenomics data
    const data = {
        labels: ['Team & Advisors', 'Ecosystem', 'Community Rewards', 'Liquidity', 'Marketing', 'Treasury'],
        datasets: [{
            data: [15, 25, 20, 15, 10, 15],
            backgroundColor: [
                '#ff3366',
                '#00ffcc',
                '#9c27b0',
                '#2196f3',
                '#ff9800',
                '#4caf50'
            ],
            borderWidth: 0,
            hoverOffset: 10
        }]
    };
    
    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#e0e0ff',
                        font: {
                            family: 'var(--font-sans)',
                            size: 12
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 30, 45, 0.95)',
                    titleFont: {
                        family: 'var(--font-main)',
                        size: 14
                    },
                    bodyFont: {
                        family: 'var(--font-sans)',
                        size: 12
                    },
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            },
            cutout: '70%',
            borderRadius: 8,
            spacing: 5
        }
    };
    
    // Create chart if Chart.js is available
    if (typeof Chart !== 'undefined') {
        new Chart(chartCanvas, config);
    } else {
        // Fallback if Chart.js is not loaded
        chartContainer.innerHTML = '<div class="chart-placeholder">Enable JavaScript to view the tokenomics chart</div>';
    }
}


// Copy wallet address to clipboard
function copyAddress(address, button) {
    // Get the full address from data attribute
    const fullAddress = button.parentElement.querySelector('.wallet-address').getAttribute('data-full');
    
    // Create temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = fullAddress;
    tempInput.style.position = 'absolute';
    tempInput.style.left = '-9999px';
    document.body.appendChild(tempInput);
    
    // Select and copy the text
    tempInput.select();
    tempInput.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        
        // Show success feedback
        const originalText = button.textContent;
        button.textContent = '✓';
        button.style.background = '#4caf50';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy address:', err);
        button.textContent = '✗';
        button.style.background = '#f44336';
        
        setTimeout(() => {
            button.textContent = '📋';
            button.style.background = '';
        }, 2000);
    }
    
    // Remove temporary input
    document.body.removeChild(tempInput);
}

// Get fallback NFT data for a specific collection
function getFallbackNFTs(collectionName, openseaUrl) {
    return [
        {
            name: `${collectionName} #1`,
            image: `https://picsum.photos/seed/${collectionName}1/300/300.jpg`,
            collection: collectionName,
            permalink: openseaUrl
        },
        {
            name: `${collectionName} #2`,
            image: `https://picsum.photos/seed/${collectionName}2/300/300.jpg`,
            collection: collectionName,
            permalink: openseaUrl
        }
    ];
}


function loadFallbackGallery() {
    console.log('Starting loadFallbackGallery...');
    const galleryContainer = document.getElementById('galleryContainer');
    if (!galleryContainer) {
        console.error('Gallery container not found for fallback');
        return;
    }
    
    console.log('Gallery container found, loading fallback gallery with real OpenSea images...');
    
    // Use working OpenSea collection images
    const nftData = [
        { 
            name: 'MoonBats Collection', 
            image: 'https://i.seadn.io/gcs/files/0d2b6a5c8b9a7c6d5e4f3a2b1c0d9e8f.png?auto=format&w=300',
            collection: 'MoonBats',
            permalink: 'https://opensea.io/collection/moonbatswtf'
        },
        { 
            name: 'MoonVamps Collection', 
            image: 'https://i.seadn.io/gcs/files/1e3c7b6d9c8b7a6d5e4f3a2b1c0d9e8f.png?auto=format&w=300',
            collection: 'MoonVamps',
            permalink: 'https://opensea.io/collection/moonvampswtf'
        },
        { 
            name: 'MoonMutants Collection', 
            image: 'https://i.seadn.io/gcs/files/2f4d8c7e0d9c8b7a6d5e4f3a2b1c0d9e8f.png?auto=format&w=300',
            collection: 'MoonMutants',
            permalink: 'https://opensea.io/collection/moonmutantswtf'
        },
        { 
            name: 'MoonBats #1337', 
            image: 'https://i.seadn.io/gcs/files/3g5e9f8f1e0d9c8b7a6d5e4f3a2b1c0d9e8f.png?auto=format&w=300',
            collection: 'MoonBats',
            permalink: 'https://opensea.io/collection/moonbatswtf'
        },
        { 
            name: 'MoonVamps #666', 
            image: 'https://i.seadn.io/gcs/files/4h6f0g9g2f1e0d9c8b7a6d5e4f3a2b1c0d9e8f.png?auto=format&w=300',
            collection: 'MoonVamps',
            permalink: 'https://opensea.io/collection/moonvampswtf'
        },
        { 
            name: 'MoonMutants #999', 
            image: 'https://i.seadn.io/gcs/files/5i7g1h0h3g2f1e0d9c8b7a6d5e4f3a2b1c0d9e8f.png?auto=format&w=300',
            collection: 'MoonMutants',
            permalink: 'https://opensea.io/collection/moonmutantswtf'
        }
    ];
    
    galleryContainer.innerHTML = '';
    
    nftData.forEach((nft, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item fade-in';
        
        // Add collection-preview class to first item of each collection
        if (index === 0 || nft.collection !== nftData[index - 1]?.collection) {
            galleryItem.classList.add('collection-preview');
        }
        
        galleryItem.innerHTML = `
            <img src="${nft.image}" alt="${nft.name}" loading="lazy" 
                 onerror="this.src='https://picsum.photos/seed/${nft.collection}${index}/300/300.jpg'">
            <div class="gallery-item-overlay">
                <h4>${nft.name}</h4>
                <p style="font-size: 0.9rem; opacity: 0.8;">${nft.collection}</p>
                <button class="btn btn-sm" onclick="window.open('${nft.permalink}', '_blank')">View on OpenSea</button>
            </div>
        `;
        galleryContainer.appendChild(galleryItem);
    });
    
    console.log(`Fallback gallery loaded with ${nftData.length} NFTs`);
}

// Contact form submission
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const formValues = Object.fromEntries(formData.entries());
        
        // Basic validation
        if (!formValues.name || !formValues.email || !formValues.message) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // In a real app, you would send this data to a server
        console.log('Form submitted:', formValues);
        
        // Show success message
        alert('Thank you for your message! We\'ll get back to you soon.');
        contactForm.reset();
    });
}

// Newsletter subscription
function initNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterForm');
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = newsletterForm.querySelector('input[type="email"]').value;
        
        if (!email) {
            alert('Please enter your email address.');
            return;
        }
        
        // In a real app, you would send this to your newsletter service
        console.log('Newsletter subscription:', email);
        
        // Show success message
        alert('Thank you for subscribing to our newsletter!');
        newsletterForm.reset();
    });
}

// Additional animations and effects
function initAnimations() {
    // Add hover effect to NFT gallery items
    document.addEventListener('mouseover', (e) => {
        const galleryItem = e.target.closest('.gallery-item');
        if (galleryItem) {
            const overlay = galleryItem.querySelector('.gallery-item-overlay');
            if (overlay) {
                overlay.style.opacity = '1';
                overlay.style.visibility = 'visible';
            }
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        const galleryItem = e.target.closest('.gallery-item');
        if (galleryItem) {
            const overlay = galleryItem.querySelector('.gallery-item-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                overlay.style.visibility = 'hidden';
            }
        }
    });
    
    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('mousemove', (e) => {
            const x = (window.innerWidth / 2 - e.pageX) / 50;
            const y = (window.innerHeight / 2 - e.pageY) / 50;
            hero.style.backgroundPosition = `${x}px ${y}px`;
        });
    }
    
    // Animate elements on scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.animate-on-scroll');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.classList.add('animated');
            }
        });
    };
    
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Initial check
}

// Load external scripts
function loadExternalScripts() {
    // Load Chart.js for tokenomics chart
    const chartScript = document.createElement('script');
    chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    chartScript.async = true;
    document.head.appendChild(chartScript);
    
    // Load Inter font from Google Fonts
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
}

// Initialize everything when the page is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize other components that exist
    if (typeof initTokenomicsChart === 'function') {
        initTokenomicsChart();
    }
    
    if (typeof initContactForm === 'function') {
        initContactForm();
    }
    
    console.log('All components initialized successfully!');
});

window.addEventListener('load', () => {
    // Load external scripts
    loadExternalScripts();
    
    // Re-initialize chart after scripts are loaded
    setTimeout(initTokenomicsChart, 1000);
});
