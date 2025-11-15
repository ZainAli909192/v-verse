async function loadBlogs() {
    try {
        const response = await fetch('./backend/index/get_blogs.php');
        const data = await response.json();
        // const data = await response.text();
        // alert(data)
        const container = document.getElementById('blogsContainer');
        
        if (data.status === 'success' && data.blogs.length > 0) {
            container.innerHTML = data.blogs.map(blog => `
                <div class="blog-item">
                    <h4>${blog.title}</h4>
                    <small>By ${blog.author_name} • ${blog.formatted_date}</small>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="no-blogs">No blogs available yet</p>';
        }
    } catch (error) {
        document.getElementById('blogsContainer').innerHTML = 
            '<p class="error-message">Error loading blogs. Please try again later.</p>';
    }
}

// Load blogs when page loads
document.addEventListener('DOMContentLoaded', loadBlogs);