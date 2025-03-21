let menuData;
let activeFilters = new Set();

async function loadMenuData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao carregar os dados:', error);
        return null;
    }
}

function renderProjects(projects) {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        const carouselHTML = `
            <div class="carousel">
                <div class="carousel-inner">
                    ${project.imagens.map((img, index) => `
                        <div class="carousel-item ${index === 0 ? 'active' : ''}">
                            <img src="${img}" alt="${project.nome}" class="project-image">
                        </div>
                    `).join('')}
                </div>
                ${project.imagens.length > 1 ? `
                    <button class="carousel-control prev" data-direction="prev">❮</button>
                    <button class="carousel-control next" data-direction="next">❯</button>
                ` : ''}
            </div>
            <div class="project-info">
                <h3 class="project-name">${project.nome}</h3>
                <div class="project-tags">
                    ${project.tecnologias.map(tech => `<span class="project-tag">${tech}</span>`).join('')}
                </div>
            </div>
        `;
        
        card.innerHTML = carouselHTML;
        
        if (project.imagens.length > 1) {
            const controls = card.querySelectorAll('.carousel-control');
            controls.forEach(control => {
                control.addEventListener('click', (e) => {
                    e.stopPropagation();
                    rotateCarousel(card, control.dataset.direction);
                });
            });
        }
        
        card.addEventListener('click', () => openModal(project));
        container.appendChild(card);
    });
}

function rotateCarousel(container, direction) {
    const items = container.querySelectorAll('.carousel-item');
    const activeItem = container.querySelector('.carousel-item.active');
    let nextIndex = Array.from(items).indexOf(activeItem) + (direction === 'next' ? 1 : -1);
    
    if (nextIndex >= items.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = items.length - 1;
    
    activeItem.classList.remove('active');
    items[nextIndex].classList.add('active');
}

function openModal(project) {
    const modal = document.getElementById('project-modal');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <div class="modal-carousel">
            <div class="carousel-inner">
                ${project.imagens.map((img, index) => `
                    <div class="carousel-item ${index === 0 ? 'active' : ''}">
                        <img src="${img}" alt="${project.nome}" class="modal-image">
                    </div>
                `).join('')}
            </div>
            ${project.imagens.length > 1 ? `
                <button class="carousel-control prev" data-direction="prev">❮</button>
                <button class="carousel-control next" data-direction="next">❯</button>
            ` : ''}
        </div>
        <h2 class="modal-title">${project.nome}</h2>
        <div class="modal-tech-tags">
            ${project.tecnologias.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
        </div>
        
        <div class="modal-tabs">
            <button class="modal-tab active" data-tab="situacao">Situação</button>
            <button class="modal-tab" data-tab="acao">Ação</button>
            <button class="modal-tab" data-tab="resultado">Resultado</button>
        </div>
        
        <div class="tab-content active" id="situacao">${project.situacao}</div>
        <div class="tab-content" id="acao">${project.acao}</div>
        <div class="tab-content" id="resultado">${project.resultado}</div>
    `;
    
    const tabs = modalBody.querySelectorAll('.modal-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            modalBody.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            modalBody.querySelector(`#${tab.dataset.tab}`).classList.add('active');
        });
    });
    
    if (project.imagens.length > 1) {
        const controls = modalBody.querySelectorAll('.carousel-control');
        controls.forEach(control => {
            control.addEventListener('click', (e) => {
                e.stopPropagation();
                rotateCarousel(modalBody, control.dataset.direction);
            });
        });
    }
    
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('project-modal');
    modal.style.display = 'none';
}

function getAllTechnologies(projects) {
    const techSet = new Set();
    projects.forEach(project => {
        if (project.tecnologias) {
            project.tecnologias.forEach(tech => techSet.add(tech));
        }
    });
    return Array.from(techSet).sort();
}

function renderTags(projects) {
    const tagsList = document.getElementById('tags-list');
    const technologies = getAllTechnologies(projects);
    
    tagsList.innerHTML = technologies.map(tech => `
        <span class="tag" data-tech="${tech}">${tech}</span>
    `).join('');

    const tags = tagsList.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('active');
            const tech = tag.dataset.tech;
            
            if (activeFilters.has(tech)) {
                activeFilters.delete(tech);
            } else {
                activeFilters.add(tech);
            }
            
            const clearButton = document.getElementById('clear-filters');
            clearButton.style.display = activeFilters.size > 0 ? 'block' : 'none';
            
            filterProjects();
        });
    });
}

function filterProjects() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    let filteredProjects = menuData.projetos;

    if (searchTerm) {
        filteredProjects = filteredProjects.filter(project => 
            project.nome.toLowerCase().includes(searchTerm) ||
            project.situacao.toLowerCase().includes(searchTerm)
        );
    }

    if (activeFilters.size > 0) {
        filteredProjects = filteredProjects.filter(project => 
            Array.from(activeFilters).every(tech => 
                project.tecnologias && project.tecnologias.includes(tech)
            )
        );
    }

    renderProjects(filteredProjects);
}

function clearFilters() {
    activeFilters.clear();
    document.querySelectorAll('.tag').forEach(tag => tag.classList.remove('active'));
    document.getElementById('clear-filters').style.display = 'none';
    document.getElementById('search-input').value = '';
    filterProjects();
}

async function initializeApp() {
    menuData = await loadMenuData();
    
    if (!menuData) {
        console.error('Não foi possível carregar os dados do menu');
        return;
    }

    renderTags(menuData.projetos);

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', filterProjects);

    const clearButton = document.getElementById('clear-filters');
    clearButton.addEventListener('click', clearFilters);

    const closeButton = document.querySelector('.close-modal');
    closeButton.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('project-modal');
        if (e.target === modal) {
            closeModal();
        }
    });

    renderProjects(menuData.projetos);
}

document.addEventListener('DOMContentLoaded', initializeApp);