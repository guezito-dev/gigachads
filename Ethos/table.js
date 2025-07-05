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

// Fonction pour calculer les gigachads qui n'ont pas encore été reviewés
function getMissingReviews(currentUser, allUsers) {
    const reviewedAvatars = new Set();
    
    console.log('=== ANALYSING USER ===');
    console.log('User:', currentUser.user.displayName);
    console.log('🔍 CURRENT USER STRUCTURE:', currentUser);
    console.log('🔍 CURRENT USER.USER:', currentUser.user);
    console.log('Reviews given:', currentUser.stats.reviewsGivenAvatars);
    
    // Récupérer tous les avatars que ce gigachad a déjà reviewé
    if (currentUser.stats.reviewsGivenAvatars && Array.isArray(currentUser.stats.reviewsGivenAvatars)) {
        currentUser.stats.reviewsGivenAvatars.forEach(review => {
            if (review.avatar) {
                reviewedAvatars.add(review.avatar);
            }
        });
    }
    
    console.log('Reviewed avatars:', Array.from(reviewedAvatars));
    console.log('=== ALL GIGACHADS AVATARS ===');
    
    // Debug de la première entrée pour comprendre la structure
    if (allUsers.length > 0) {
        console.log('🔍 FIRST USER STRUCTURE:', allUsers[0]);
        console.log('🔍 FIRST USER.USER:', allUsers[0].user);
        console.log('🔍 ALL KEYS IN FIRST USER:', Object.keys(allUsers[0]));
        console.log('🔍 ALL KEYS IN FIRST USER.USER:', Object.keys(allUsers[0].user));
    }
    
    // Filtrer les gigachads qui n'ont pas encore été reviewés
    const missingReviews = allUsers.filter(user => {
        // Utiliser displayName comme fallback si userkey n'existe pas
        const currentUserID = currentUser.user.userkey || currentUser.user.displayName;
        const userID = user.user.userkey || user.user.displayName;
        
        const isNotSelf = userID !== currentUserID;
        const notReviewed = !reviewedAvatars.has(user.user.avatarUrl);
        
        console.log(`Checking ${user.user.displayName}:`);
        console.log(`  - UserID: ${userID}`);
        console.log(`  - Is not self: ${isNotSelf}`);
        console.log(`  - Avatar URL: ${user.user.avatarUrl}`);
        console.log(`  - Not reviewed: ${notReviewed}`);
        
        return isNotSelf && notReviewed;
    });
    
    console.log('=== FINAL RESULT ===');
    console.log('Missing reviews count:', missingReviews.length);
    console.log('Missing reviews:', missingReviews);
    
    return missingReviews;
}
// Fonction pour afficher la modal avec les personnes manquantes
function showMissingReviewsModal(userIndex) {
    const user = rankingData[userIndex];
    const missingReviews = getMissingReviews(user, rankingData);
    
    // Créer la modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>🙏 ${user.user.displayName} should review these Gigachads</h2>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Missing reviews: <strong>${missingReviews.length}</strong> Gigachads</p>
                <div class="missing-reviews-list">
                    ${missingReviews.map(missingUser => `
                        <div class="missing-review-item">
                            <img src="${missingUser.user.avatarUrl}" alt="${missingUser.user.displayName}" class="avatar-small" 
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNDAiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+Cg=='" />
                            <div class="user-info">
                                <span class="user-name">${missingUser.user.displayName}</span>
                                <span class="user-rank">Rank #${missingUser.rank}</span>
                            </div>
                            <div class="user-actions">
                                <a href="${missingUser.user.profileUrl}" target="_blank" class="btn-ethos">
                                    📝 Review on Ethos
                                </a>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${missingReviews.length === 0 ? `
                    <div class="no-missing-reviews">
                        <p>🎉 ${user.user.displayName} has reviewed all Gigachads!</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Ajouter l'événement pour fermer en cliquant sur l'overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Fonction pour fermer la modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Fonction pour échapper les caractères spéciaux dans JSON
function escapeJsonForHtml(obj) {
    return JSON.stringify(obj).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

// Fonction pour afficher le tableau
function renderTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    data.forEach((user, index) => {
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

        // Calculer les reviews manquantes
        const missingReviews = getMissingReviews(user, data);
        const missingCount = missingReviews.length;

        // Créer les attributs data de manière sécurisée
        const vouchesGivenData = user.stats.vouchesGivenAvatars || [];
        const reviewsGivenData = user.stats.reviewsGivenAvatars || [];
        const vouchesReceivedData = user.stats.vouchesReceivedAvatars || [];
        const reviewsReceivedData = user.stats.reviewsReceivedAvatars || [];

        row.innerHTML = `
            <td>${medal}</td>
            <td>
                <img src="${user.user.avatarUrl}" alt="${user.user.displayName}" class="img-avatar" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNDAiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+Cg=='" />
                ${user.user.displayName}
            </td>
            <td data-vouches-given-avatars='${escapeJsonForHtml(vouchesGivenData)}' class="sortable-cell" onclick="sortTable('vouchesGiven')">${user.stats.vouchesGiven}</td>
            <td data-reviews-given-avatars='${escapeJsonForHtml(reviewsGivenData)}' class="sortable-cell" onclick="sortTable('reviewsGiven')">${user.stats.reviewsGiven}</td>
            <td data-vouches-received-avatars='${escapeJsonForHtml(vouchesReceivedData)}'>${user.stats.vouchesReceived}</td>
            <td data-reviews-received-avatars='${escapeJsonForHtml(reviewsReceivedData)}'>${user.stats.reviewsReceived}</td>
            <td class="sortable-cell" onclick="sortTable('totalScore')">${user.stats.totalScore}</td>
            <td><a href="${user.user.profileUrl}" target="_blank" class="ethos-link">Ethos</a></td>
            <td><a href="${user.user.twitterUrl}" target="_blank" class="twitter-link">X Profile</a></td>
            <td class="review-me-please">
                <button class="btn-review-me" onclick="showMissingReviewsModal(${index})">
                    ${missingCount} missing <img src="img/gigachad.png" alt="icon" class="btn-icon">
                </button>

            </td>
        `;
        tableBody.appendChild(row);
    });

    attachTooltipListeners();
}

// Fonction d'attachement des tooltips
function attachTooltipListeners() {
    document.querySelectorAll("td[data-reviews-given-avatars], td[data-vouches-given-avatars], td[data-reviews-received-avatars], td[data-vouches-received-avatars]").forEach(cell => {
        cell.addEventListener('mouseenter', function(event) {
            let avatars = [];
            
            try {
                if (this.hasAttribute('data-reviews-given-avatars')) {
                    const dataAttr = this.getAttribute('data-reviews-given-avatars');
                    avatars = JSON.parse(dataAttr.replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
                } else if (this.hasAttribute('data-vouches-given-avatars')) {
                    const dataAttr = this.getAttribute('data-vouches-given-avatars');
                    avatars = JSON.parse(dataAttr.replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
                } else if (this.hasAttribute('data-reviews-received-avatars')) {
                    const dataAttr = this.getAttribute('data-reviews-received-avatars');
                    avatars = JSON.parse(dataAttr.replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
                } else if (this.hasAttribute('data-vouches-received-avatars')) {
                    const dataAttr = this.getAttribute('data-vouches-received-avatars');
                    avatars = JSON.parse(dataAttr.replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
                }
            } catch (e) {
                console.error('Erreur lors du parsing des avatars:', e);
                return;
            }
            
            if (!avatars || avatars.length === 0) {
                return;
            }
            
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            
            avatars.forEach(avatar => {
                const img = document.createElement('img');
                img.src = avatar.avatar || avatar.avatarUrl || '';
                img.alt = avatar.displayName || 'Avatar';
                img.onerror = function() {
                    this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNDAiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+Cg==';
                };
                tooltip.appendChild(img);
            });

            document.body.appendChild(tooltip);
            
            // Fonction pour positionner le tooltip
            const moveTooltip = (e) => {
                tooltip.style.left = `${e.pageX + 10}px`;
                tooltip.style.top = `${e.pageY + 10}px`;
            };
            
            // Positionnement initial
            moveTooltip(event);
            
            // Gestionnaire de mouvement
            const mouseMoveHandler = (e) => moveTooltip(e);
            
            // Gestionnaire de sortie
            const mouseLeaveHandler = () => {
                tooltip.remove();
                this.removeEventListener('mousemove', mouseMoveHandler);
                this.removeEventListener('mouseleave', mouseLeaveHandler);
            };
            
            // Attacher les événements
            this.addEventListener('mousemove', mouseMoveHandler);
            this.addEventListener('mouseleave', mouseLeaveHandler);
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
    
    // Recalculer les rangs après le tri
    rankingData.forEach((user, index) => {
        user.rank = index + 1;
    });
    
    renderTable(rankingData);
}

// Fonction pour gérer la fermeture de la modal avec la touche Échap
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Exposer les fonctions globalement pour les événements onclick
window.showMissingReviewsModal = showMissingReviewsModal;
window.closeModal = closeModal;
window.sortTable = sortTable;
