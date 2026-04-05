// --- VIEW NAVIGATION LOGIC ---
const allViews = [
    'view-dashboard', 'view-query', 'view-methodology',
    'view-course', 'view-plagiarism', 'view-math', 'view-coming-soon', 'view-publications', 'view-search', 'view-settings', 'view-calculator'
];

function showView(viewId) {
    allViews.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const target = document.getElementById(viewId);
    if (target) target.style.display = 'flex';

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    // Trigger data fetches on view open ONLY if not cached
    if (viewId === 'view-publications' && !publicationsCache) {
        if (typeof fetchUserPublications === 'function') fetchUserPublications();
    }
    
    // Dynamic loading of methodology data specifically when going to methodology view or course view
    if ((viewId === 'view-methodology' || viewId === 'view-course') && typeof ensureCourseDataLoaded === 'function') {
        ensureCourseDataLoaded();
    }

    if (viewId === 'view-dashboard') {
        if (sidebar) sidebar.style.display = ''; // Let CSS media queries handle display state
    } else {
        if (sidebar) sidebar.style.display = 'none';
    }

    // Always close mobile sidebar when switching views
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;

    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');

        const dashboard = document.getElementById('view-dashboard');
        if (dashboard && dashboard.style.display !== 'none') {
            sidebar.style.display = '';
        } else {
            sidebar.style.display = 'none';
        }
    } else {
        const dashboard = document.getElementById('view-dashboard');
        if (dashboard && dashboard.style.display !== 'none') {
            sidebar.style.display = '';
        }
    }
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}
