window.onscroll = function () { scrollFunction() };
const nav_element = document.getElementById('nav-scroll')
const logo_element = document.getElementById('logo-scroll')

function scrollFunction() {
    if (document.body.scrollTop > 15 || document.documentElement.scrollTop > 15) {
        nav_element.classList.add('scroll-class')
        logo_element.classList.add('scroll_')
    } else {
        if (nav_element == null) {
            console.log('Null')
        } else {
            nav_element.classList.remove('scroll-class')
            logo_element.classList.remove('scroll_')
        }
    }
}

scrollFunction() 