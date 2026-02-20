// Gallery Configuration
const process = { env: { OPENSEA_API_KEY: "28ec6ec0b00a4a2a9ddb67180071e784" } };
const CHAINS = "ethereum";

const COLLECTIONS = [
    { key: "moonbats",   name: "MoonBats",   contract: "0xdcaf23e44639daf29f6532da213999d737f15aa4" },
    { key: "moonvamps",  name: "MoonVamps",  contract: "0x67e23ce9d03aaaa1a95b6784eca0942c3f7d85fe" },
    { key: "moonmutants",name: "MoonMutants",contract: "0xc63b0e0A832A3A5C24Ba7768aaA39A2ea3995eFD" }
];

const PER_COLLECTION = 24;

// Gallery Variables
let currentFilter = 'all';
let galleryItems = [];

// Fetch NFTs from OpenSea API
async function fetchNFTsFromOpenSea(contract) {
    const apiKey = process.env.OPENSEA_API_KEY;
    const chain = CHAINS;
    
    const url = `https://api.opensea.io/v2/chain/${chain}/contract/${contract}/nfts`;
    
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            'X-API-KEY': apiKey
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`OpenSea API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.nfts || [];
    } catch (error) {
        console.error('OpenSea API fetch error:', error);
        throw error;
    }
}

// Create gallery item element
function createGalleryItem(nft, collection) {
    const item = document.createElement('a');
    item.className = 'nft-card';
    item.dataset.collection = collection.key;
    item.href = `https://opensea.io/assets/ethereum/${collection.contract}/${nft.identifier}`;
    item.target = '_blank';
    item.rel = 'noopener noreferrer';
    
    // Get image URL with fallback
    let imageUrl = nft.image_url;
    if (!imageUrl && nft.display_image_url) {
        imageUrl = nft.display_image_url;
    }
    if (!imageUrl && nft.metadata && nft.metadata.image) {
        imageUrl = nft.metadata.image;
    }
    
    // Fallback to placeholder if no image
    if (!imageUrl) {
        imageUrl = `https://picsum.photos/seed/${collection.key}${nft.identifier || 'default'}/400/400.jpg`;
    }

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = `${collection.name} #${nft.identifier}`;
    img.loading = 'lazy';
    
    // Add error handling for images
    img.onerror = () => {
        img.src = `https://picsum.photos/seed/${collection.key}${nft.identifier || 'default'}/400/400.jpg`;
    };

    item.appendChild(img);

    return item;
}

// Randomize array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Initialize gallery with OpenSea API and error handling
async function initGallery() {
    const loadingEl = document.getElementById('gallery-loading');
    const errorEl = document.getElementById('gallery-error');
    const gridEl = document.getElementById('gallery-grid');

    if (!loadingEl || !gridEl) return;

    // Show loading state
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    gridEl.style.display = 'none';

    try {
        // Fetch NFTs from all collections with concurrency control
        const allNFTs = [];
        const batchSize = 2; // Process 2 collections at a time
        
        for (let i = 0; i < COLLECTIONS.length; i += batchSize) {
            const batch = COLLECTIONS.slice(i, i + batchSize);
            const batchPromises = batch.map(async (collection) => {
                try {
                    const nfts = await fetchNFTsFromOpenSea(collection.contract);
                    
                    // Randomize and select 24 NFTs per collection
                    const shuffledNFTs = shuffleArray(nfts);
                    const selectedNFTs = shuffledNFTs.slice(0, PER_COLLECTION);
                    
                    // Create gallery items
                    return selectedNFTs.map(nft => {
                        const item = createGalleryItem(nft, collection);
                        galleryItems.push(item);
                        return item;
                    });
                } catch (error) {
                    console.error(`Error fetching ${collection.name}:`, error);
                    // Return empty array for failed collection
                    return [];
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            batchResults.flat().forEach(item => allNFTs.push(item));
        }

        // Randomize all items together
        const shuffledAll = shuffleArray(allNFTs);
        
        // Hide loading and show grid
        loadingEl.style.display = 'none';
        gridEl.style.display = 'grid';
        
        // Add to grid with staggered animation
        shuffledAll.forEach((item, index) => {
            item.style.opacity = '0';
            gridEl.appendChild(item);
            
            // Staggered fade-in
            setTimeout(() => {
                item.style.opacity = '1';
            }, index * 50);
        });

    } catch (error) {
        console.error('Error initializing gallery:', error);
        showError(error.message);
    }
}

// Show error state
function showError(message) {
    const loadingEl = document.getElementById('gallery-loading');
    const errorEl = document.getElementById('gallery-error');
    const errorMessageEl = document.getElementById('error-message');
    
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'block';
    if (errorMessageEl) errorMessageEl.textContent = message;
}

// Fallback gallery with placeholder images
function initFallbackGallery() {
    const gridEl = document.getElementById('gallery-grid');
    if (!gridEl) return;

    COLLECTIONS.forEach(collection => {
        for (let i = 1; i <= PER_COLLECTION; i++) {
            const item = document.createElement('a');
            item.className = 'nft-card';
            item.dataset.collection = collection.key;
            item.href = `https://opensea.io/assets/ethereum/${collection.contract}/${i}`;
            item.target = '_blank';
            item.rel = 'noopener noreferrer';
            
            const image = `https://picsum.photos/seed/${collection.key}${i}/400/400.jpg`;

            const img = document.createElement('img');
            img.src = image;
            img.alt = `${collection.name} #${i}`;
            img.loading = 'lazy';

            item.appendChild(img);

            galleryItems.push(item);
            gridEl.appendChild(item);
        }
    });
}

// Filter gallery items
function filterGallery(filter) {
    currentFilter = filter;
    const items = document.querySelectorAll('.nft-card');
    
    items.forEach(item => {
        if (filter === 'all' || item.dataset.collection === filter) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Modal functionality
function openModal(imageUrl, openSeaUrl) {
    const modal = document.getElementById('nft-modal');
    const modalImg = document.getElementById('modal-image');
    const modalLink = document.getElementById('modal-link');
    
    if (modal && modalImg && modalLink) {
        modalImg.src = imageUrl;
        modalLink.href = openSeaUrl;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('nft-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Initialize modal close handlers
document.addEventListener('DOMContentLoaded', () => {
    const modalClose = document.getElementById('modal-close');
    const modal = document.getElementById('nft-modal');
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
});

// Filter buttons
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.gallery-controls button');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Filter gallery
            const filter = button.dataset.filter;
            filterGallery(filter);
        });
    });
});

// Tokenomics Implementation
const tokenomics = {
    symbol: "$BLOOD",
    totalSupply: "1,000,000,000",
    contractAddress: "0x3982E57fF1b193Ca8eb03D16Db268Bd4B40818f8",
    network: "Base",
    distribution: [
        { id: "community", label: "Community & Rewards", percent: 40, amount: "400,000,000", color: "#ff2b2b" },
        { id: "team", label: "Team & Development", percent: 20, amount: "200,000,000", color: "#b00000" },
        { id: "marketing", label: "Marketing", percent: 15, amount: "150,000,000", color: "#ff6b6b" },
        { id: "liquidity", label: "Liquidity", percent: 10, amount: "100,000,000", color: "#47c9ff" },
        { id: "staking", label: "Staking Rewards", percent: 10, amount: "100,000,000", color: "#39d6c5" },
        { id: "reserve", label: "Reserve", percent: 5, amount: "50,000,000", color: "#a8e6cf" }
    ],
    tracking: {
        dexScreener: "https://dexscreener.com/base/0x7db4a2fd91ec324e2efb0e9aa56011bc9f02b56a",
        geckoTerminal: "https://www.geckoterminal.com/base/pools/0x7db4a2fd91ec324e2efb0e9aa56011bc9f02b56a"
    },
    community: {
        telegram: "https://t.me/blood_token",
        twitter: "https://twitter.com/choose_blood"
    }
};

// Tokenomics Section Class
class TokenomicsSection {
    constructor() {
        this.isMobile = false;
        this.activeId = null;
        
        this.init();
    }

    init() {
        this.renderTokenInfo();
        this.renderPieChart();
        this.renderDistributionList();
        this.setupResponsiveCheck();
        this.setupTooltip();
        this.setupCopyButton();
    }

    renderTokenInfo() {
        // Update total supply
        const totalSupplyEl = document.getElementById('total-supply');
        if (totalSupplyEl) {
            totalSupplyEl.textContent = `${tokenomics.totalSupply} ${tokenomics.symbol}`;
        }

        // Update contract address
        const contractEl = document.getElementById('contract-address');
        if (contractEl) {
            contractEl.textContent = tokenomics.contractAddress;
        }

        // Update pie center
        const pieSymbolEl = document.querySelector('.pie-symbol');
        const pieTotalEl = document.querySelector('.pie-total');
        
        if (pieSymbolEl) {
            pieSymbolEl.textContent = tokenomics.symbol;
        }
        if (pieTotalEl) {
            pieTotalEl.textContent = 'Total Supply';
        }
    }

    renderPieChart() {
        const pieChart = document.getElementById('pie-chart');
        if (!pieChart) return;

        let currentPercent = 0;
        const gradientStops = [];

        tokenomics.distribution.forEach(item => {
            const startPercent = currentPercent;
            const endPercent = currentPercent + item.percent;
            
            gradientStops.push(`${item.color} ${startPercent}% ${endPercent}%`);
            currentPercent = endPercent;
        });

        const gradient = `conic-gradient(${gradientStops.join(', ')})`;
        pieChart.style.background = gradient;
    }

    renderDistributionList() {
        const listEl = document.getElementById('distribution-list');
        if (!listEl) return;

        listEl.innerHTML = '';
        
        // Create 3 column structure
        const labelsHtml = tokenomics.distribution.map(item => 
            `<div class="distribution-label-item" data-id="${item.id}" style="color: ${item.color}">${item.label}</div>`
        ).join('');
        
        const percentsHtml = tokenomics.distribution.map(item => 
            `<div class="distribution-percent-item" data-id="${item.id}" style="color: ${item.color}">${item.percent}%</div>`
        ).join('');
        
        const amountsHtml = tokenomics.distribution.map(item => 
            `<div class="distribution-amount-item" data-id="${item.id}" style="color: ${item.color}; opacity: 0.7">${item.amount} ${tokenomics.symbol}</div>`
        ).join('');

        listEl.innerHTML = `
            <div class="distribution-columns">
                <div class="distribution-column labels-column">
                    <div class="column-content">${labelsHtml}</div>
                </div>
                <div class="distribution-column percents-column">
                    <div class="column-content">${percentsHtml}</div>
                </div>
                <div class="distribution-column amounts-column">
                    <div class="column-content">${amountsHtml}</div>
                </div>
            </div>
        `;

        // Add hover interactions
        this.setupColumnInteractions();
    }

    setupColumnInteractions() {
        const allItems = document.querySelectorAll('[data-id]');
        
        allItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const id = item.dataset.id;
                // Highlight all items with same id
                document.querySelectorAll(`[data-id="${id}"]`).forEach(el => {
                    el.classList.add('highlighted');
                });
            });
            
            item.addEventListener('mouseleave', () => {
                // Remove all highlights
                document.querySelectorAll('.highlighted').forEach(el => {
                    el.classList.remove('highlighted');
                });
            });
        });
    }

    setupResponsiveCheck() {
        const checkResponsive = () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth < 768;
            
            if (wasMobile !== this.isMobile) {
                // Reset active state when switching between mobile/desktop
                this.setActiveId(null);
                this.updateTooltipVisibility();
            }
        };

        window.addEventListener('resize', checkResponsive);
    }

    setupTooltip() {
        const tooltip = document.getElementById('distribution-tooltip');
        const tooltipText = tooltip.querySelector('.tooltip-text');
        const tooltipCaret = tooltip.querySelector('.tooltip-caret');
        const tooltipClose = document.getElementById('tooltip-close');
        const distributionItems = document.querySelectorAll('[data-id]');
        const pieChart = document.getElementById('pie-chart');

        distributionItems.forEach((item) => {
            // Desktop hover behavior
            item.addEventListener('mouseenter', () => {
                if (!this.isMobile) {
                    this.setActiveId(item.dataset.id);
                    this.updateTooltip(item, tooltip, tooltipText, tooltipCaret, pieChart);
                }
            });

            item.addEventListener('mouseleave', () => {
                if (!this.isMobile) {
                    this.setActiveId(null);
                    this.updateTooltipVisibility();
                }
            });

            // Mobile tap behavior
            item.addEventListener('click', (e) => {
                if (this.isMobile) {
                    e.preventDefault();
                    const itemId = item.dataset.id;
                    
                    // Toggle active state
                    if (this.activeId === itemId) {
                        this.setActiveId(null);
                    } else {
                        this.setActiveId(itemId);
                        this.updateTooltip(item, tooltip, tooltipText, tooltipCaret, pieChart);
                    }
                }
            });

            // Keyboard accessibility
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });

        // Close button functionality (mobile only)
        if (tooltipClose) {
            tooltipClose.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setActiveId(null);
                this.updateTooltipVisibility();
            });
        }

        // Click outside to close (mobile only)
        document.addEventListener('click', (e) => {
            if (this.isMobile && this.activeId) {
                if (!e.target.closest('[data-id]') && !e.target.closest('.distribution-tooltip')) {
                    this.setActiveId(null);
                    this.updateTooltipVisibility();
                }
            }
        });
    }

    updateTooltip(item, tooltip, tooltipText, tooltipCaret, pieChart) {
        // Get data from tokenomics distribution
        const itemId = item.dataset.id;
        const itemData = tokenomics.distribution.find(d => d.id === itemId);
        
        if (!itemData) return;
        
        // Update tooltip content
        let tooltipContent = `${itemData.label} — ${itemData.percent}% (${itemData.amount} ${tokenomics.symbol})`;
        
        // Add vesting info if available
        if (itemData.vesting) {
            tooltipContent += `<br><small>${itemData.vesting}</small>`;
        }
        
        tooltipText.innerHTML = tooltipContent;
        tooltip.style.backgroundColor = itemData.color;
        tooltipCaret.style.borderLeftColor = itemData.color;
        
        if (this.isMobile) {
            // Mobile: position in center of tooltip slot
            tooltip.style.top = '50%';
            tooltip.style.transform = 'translateY(-50%)';
        } else {
            // Desktop: position to align with hovered item
            const itemRect = item.getBoundingClientRect();
            const tooltipSlot = document.querySelector('.tooltip-slot');
            const slotRect = tooltipSlot.getBoundingClientRect();
            
            const tooltipHeight = tooltip.offsetHeight;
            const itemCenter = itemRect.top - slotRect.top + (itemRect.height / 2);
            const tooltipTop = itemCenter - (tooltipHeight / 2);
            
            // Keep tooltip within slot bounds
            let finalTop = tooltipTop;
            if (finalTop < 10) finalTop = 10;
            if (finalTop + tooltipHeight > slotRect.height - 10) {
                finalTop = slotRect.height - tooltipHeight - 10;
            }
            
            tooltip.style.top = `${finalTop}px`;
            tooltip.style.transform = 'none';
        }
        
        this.updateTooltipVisibility();
        
        // Highlight pie chart
        if (pieChart) {
            pieChart.classList.add('highlighted');
        }
    }

    updateTooltipVisibility() {
        const tooltip = document.getElementById('distribution-tooltip');
        const pieChart = document.getElementById('pie-chart');
        const distributionItems = document.querySelectorAll('[data-id]');
        
        if (this.activeId) {
            tooltip.classList.add('active');
            
            // Update active state and accessibility
            distributionItems.forEach(item => {
                const isActive = item.dataset.id === this.activeId;
                item.classList.toggle('active', isActive);
                item.setAttribute('aria-expanded', isActive.toString());
            });
        } else {
            tooltip.classList.remove('active');
            
            // Remove active state and reset accessibility
            distributionItems.forEach(item => {
                item.classList.remove('active');
                item.setAttribute('aria-expanded', 'false');
            });
            
            if (pieChart) {
                pieChart.classList.remove('highlighted');
            }
        }
    }

    setupCopyButton() {
        const copyBtn = document.getElementById('copy-contract');
        const feedback = document.getElementById('copy-feedback');
        
        if (!copyBtn || !feedback) return;

        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(tokenomics.contractAddress);
                
                // Show feedback
                feedback.classList.add('show');
                copyBtn.textContent = '✓ Copied';
                
                // Reset after 2 seconds
                setTimeout(() => {
                    feedback.classList.remove('show');
                    copyBtn.textContent = '📋 Copy';
                }, 2000);
                
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = tokenomics.contractAddress;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                feedback.classList.add('show');
                copyBtn.textContent = '✓ Copied';
                
                setTimeout(() => {
                    feedback.classList.remove('show');
                    copyBtn.textContent = '📋 Copy';
                }, 2000);
            }
        });
    }

    setActiveId(id) {
        this.activeId = id;
    }
}

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize essential components only
    initPreloader();
    initMobileMenu();
    initSmoothScrolling();
    initScrollReveal();
    initBackToTop();
    
    // Initialize tokenomics
    new TokenomicsSection();
    
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
      navLinks.classList.toggle('is-open');
      menuBtn.classList.toggle('active'); // ok für Burger-Animation, falls du sie nutzt
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
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

// Copy wallet address to clipboard
function copyAddress(address, button) {
    // Create temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = address;
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

// Initialize community wallet copy buttons
function initCommunityWalletCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn[data-address]');
    
    copyButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const address = button.getAttribute('data-address');
            
            try {
                // Try modern clipboard API first
                await navigator.clipboard.writeText(address);
                
                // Show success feedback
                const originalText = button.textContent;
                button.textContent = '✓';
                button.style.background = '#4caf50';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                }, 2000);
                
            } catch (err) {
                // Fallback for older browsers
                copyAddress(address, button);
            }
        });
    });
}

// Legal Modal functionality
function openLegalModal(contentId, title) {
    const modal = document.getElementById('legal-modal');
    const modalTitle = document.getElementById('legal-modal-title');
    const modalBody = document.getElementById('legal-modal-body');
    const contentElement = document.getElementById(contentId + '-content');
    
    if (!modal || !modalTitle || !modalBody || !contentElement) {
        console.error('Legal modal elements not found');
        return;
    }
    
    // Set title
    modalTitle.textContent = title;
    
    // Copy content to modal
    modalBody.innerHTML = contentElement.innerHTML;
    
    // Show modal
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
}

function closeLegalModal() {
    const modal = document.getElementById('legal-modal');
    
    if (!modal) return;
    
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
}

// Initialize legal modal event listeners
function initLegalModal() {
    // Legal links
    const termsLink = document.querySelector('a[href="#terms"]');
    const privacyLink = document.querySelector('a[href="#privacy"]');
    const cookiePolicyLink = document.querySelector('a[href="#cookie-policy"]');
    
    // Modal close button
    const modalClose = document.getElementById('legal-modal-close');
    const modalBackdrop = document.getElementById('legal-modal-backdrop');
    const modal = document.getElementById('legal-modal');
    
    // Add click handlers to legal links
    if (termsLink) {
        termsLink.addEventListener('click', (e) => {
            e.preventDefault();
            openLegalModal('terms', 'Terms of Service');
        });
    }
    
    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            openLegalModal('privacy', 'Privacy Policy');
        });
    }
    
    if (cookiePolicyLink) {
        cookiePolicyLink.addEventListener('click', (e) => {
            e.preventDefault();
            openLegalModal('cookie-policy', 'Cookie Policy');
        });
    }
    
    // Close modal handlers
    if (modalClose) {
        modalClose.addEventListener('click', closeLegalModal);
    }
    
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeLegalModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLegalModal();
            }
        });
    }
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeLegalModal();
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initCommunityWalletCopyButtons();
    initLegalModal();
});
