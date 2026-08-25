const teamTypeSelect = document.getElementById('team_type');
const coFoundersSection = document.getElementById('coFoundersSection');
const coFoundersInput = document.getElementById('co_founders_codes');

if (teamTypeSelect) {
    teamTypeSelect.addEventListener('change', function () {
        if (this.value === 'team' || this.value === 'large-team') {
            coFoundersSection.classList.remove('hidden');
            coFoundersInput.setAttribute('required', 'required');
        } else {
            coFoundersSection.classList.add('hidden');
            coFoundersInput.removeAttribute('required');
            coFoundersInput.value = '';
        }
    });
}