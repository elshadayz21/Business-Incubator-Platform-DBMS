document.querySelectorAll('button').forEach(button => {
    if (button.textContent.includes('ATTEND WORKSHOP')) {
        button.addEventListener('click', function () {
            alert('Workshop registration coming soon!');
        });
    }
});