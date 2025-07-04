let rankingData = [];

// Récupération des données
document.addEventListener('DOMContentLoaded', () => {
    fetch('gigachads-ranking.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            rankingData = data.ranking;
            renderTable(rankingData);
        })
        .catch(error => {
            console.error('Erreur lors du chargement des données:', error);
        });
});

// Fonction pour afficher le tableau
function renderTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Efface les données du tableau existant

    data.forEach(user => {
        const row = document.createElement('tr');
        let medal = '';

        if (user.rank === 1) {
            medal = '🥇';
        } else if (user.rank === 2) {
            medal = '🥈';
        } else if (user.rank === 3) {
            medal = '🥉';
        } else {
            medal = user.rank;
        }

        row.innerHTML = `
            <td>${medal}</td>
            <td>
                <img src="${user.user.avatarUrl}" alt="${user.user.displayName}" class="img-avatar" />
                ${user.user.displayName}
            </td>
            <td data-vouches-given-avatars='${JSON.stringify(user.stats.vouchesGivenAvatars)}' onclick="sortTable('vouchesGiven')">${user.stats.vouchesGiven}</td>
            <td data-reviews-given-avatars='${JSON.stringify(user.stats.reviewsGivenAvatars)}' onclick="sortTable('reviewsGiven')">${user.stats.reviewsGiven}</td>
            <td data-vouches-received-avatars='${JSON.stringify(user.stats.vouchesReceivedAvatars)}'>${user.stats.vouchesReceived}</td>
            <td data-reviews-received-avatars='${JSON.stringify(user.stats.reviewsReceivedAvatars)}'>${user.stats.reviewsReceived}</td>
            <td>${user.stats.totalScore}</td>
            <td><a href="${user.user.profileUrl}" target="_blank">Ethos</a></td>
            <td><a href="${user.user.twitterUrl}" target="_blank">X</a></td>
        `;
        tableBody.appendChild(row);
    });

    attachTooltipListeners();
}

// Fonction d'attachement des tooltips
function attachTooltipListeners() {
    document.querySelectorAll("td[data-reviews-given-avatars], td[data-vouches-given-avatars], td[data-reviews-received-avatars], td[data-vouches-received-avatars]").forEach(cell => {
        cell.addEventListener('mouseenter', function(event) {
            let avatars;
            if (this.hasAttribute('data-reviews-given-avatars')) {
                avatars = JSON.parse(this.getAttribute('data-reviews-given-avatars'));
            } else if (this.hasAttribute('data-vouches-given-avatars')) {
                avatars = JSON.parse(this.getAttribute('data-vouches-given-avatars'));
            } else if (this.hasAttribute('data-reviews-received-avatars')) {
                avatars = JSON.parse(this.getAttribute('data-reviews-received-avatars'));
            } else if (this.hasAttribute('data-vouches-received-avatars')) {
                avatars = JSON.parse(this.getAttribute('data-vouches-received-avatars'));
            }
            
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            
            avatars.forEach(avatar => {
                const img = document.createElement('img');
                img.src = avatar.avatar;
                img.alt = 'Avatar';
                tooltip.appendChild(img);
            });

            document.body.appendChild(tooltip);
            tooltip.style.left = `${event.pageX + 10}px`;
            tooltip.style.top = `${event.pageY + 10}px`;
            
            this.addEventListener('mousemove', (event) => {
                tooltip.style.left = `${event.pageX + 10}px`;
                tooltip.style.top = `${event.pageY + 10}px`;
            });

            this.addEventListener('mouseleave', () => {
                tooltip.remove();
            });
        });
    });
}

// Fonction de tri
function sortTable(key) {
    rankingData.sort((a, b) => {
        const valueA = a.stats[key];
        const valueB = b.stats[key];
        return valueB - valueA; // Tri descendant
    });
    renderTable(rankingData);
}
