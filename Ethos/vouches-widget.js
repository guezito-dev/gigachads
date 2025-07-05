const DEBUG_MODE = true;
const MAX_ITEMS = 8;
const GITHUB_JSON_URL = 'https://raw.githubusercontent.com/guezito-dev/notion-gigachads/main/Ethos/gigachads-ranking.json';

let gigachadsData = null;
const processedActivities = new Set();

// ========== Cache System ==========
class VouchesCache {
    constructor() {
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    }
    
    getCacheKey(userkey) {
        return `vouches_${userkey}`;
    }
    
    get(userkey) {
        const key = this.getCacheKey(userkey);
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            debug(`Cache hit for ${userkey}`);
            return cached.data;
        }
        
        return null;
    }
    
    set(userkey, data) {
        const key = this.getCacheKey(userkey);
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
}

const vouchesCache = new VouchesCache();

function debug(message, data = null) {
    if (DEBUG_MODE) {
        console.log(`[VOUCHES] ${message}`, data);
    }
}

// ========== Utils ==========

function formatTimeAgo(timestamp) {
    let t = parseInt(timestamp, 10);
    if (t < 1e12) t = t * 1000;
    const now = Date.now();
    const diff = Math.floor((now - t) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 2592000)}mo ago`;
}

function weiToEth(wei) {
    if (!wei || wei === '0') return '0.000';
    return (parseInt(wei) / 1e18).toFixed(3);
}

function getStakedAmount(activity) {
    if (activity.data?.deposited) {
        return weiToEth(activity.data.deposited);
    }
    if (activity.content?.deposited) {
        return weiToEth(activity.content.deposited);
    }
    if (activity.data?.staked) {
        return weiToEth(activity.data.staked);
    }
    if (activity.content?.stakeAmount) {
        return parseFloat(activity.content.stakeAmount).toFixed(3);
    }
    if (activity.content?.staked) {
        return weiToEth(activity.content.staked);
    }
    return '0.000';
}

function showError(message, details = null) {
    console.error('[ERROR]', message, details);
    document.getElementById('loading').style.display = 'none';
    const errorEl = document.getElementById('error');
    errorEl.style.display = 'block';
    errorEl.innerHTML = `<div class="error">${message}</div>`;
}

// ========== Activity Parsing ==========

function createUniqueId(activity) {
    const authorId = activity.author?.profileId || activity.authorUser?.profileId;
    const subjectId = activity.subject?.profileId || activity.subjectUser?.profileId;
    const timestamp = activity.createdAt || activity.timestamp;
    const type = activity.type;
    return `${type}-${authorId}-${subjectId}-${timestamp}`;
}

async function fetchUserActivities(userkey) {
    debug(`Fetching activities for ${userkey}`);
    
    // Check cache first
    const cachedData = vouchesCache.get(userkey);
    if (cachedData) {
        return cachedData;
    }
    
    try {
        const response = await fetch('https://api.ethos.network/api/v2/activities/profile/all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                userkey: userkey,
                excludeHistorical: false,
                limit: 50,
                offset: 0
            })
        });

        if (response.ok) {
            const data = await response.json();
            const result = {
                activities: data.values || [],
                total: data.total || 0
            };
            
            // Cache the result
            vouchesCache.set(userkey, result);
            return result;
        } else {
            return { activities: [], total: 0 };
        }
    } catch (error) {
        debug(`Error fetching activities for ${userkey}:`, error);
        return { activities: [], total: 0 };
    }
}

// ========== Main Fetch Logic ==========

async function fetchRecentVouches() {
    debug('Starting vouches fetch...');
    if (!gigachadsData || !gigachadsData.ranking) {
        throw new Error('Giga Chads data not available');
    }

    const allVouches = [];
    const gigachadProfileIds = new Set(gigachadsData.ranking.map(u => u.user.profileId));
    const profileIdToUser = new Map(gigachadsData.ranking.map(u => [u.user.profileId, u.user]));
    processedActivities.clear();

    debug('Giga Chads detected', { count: gigachadProfileIds.size });
    const usersToCheck = gigachadsData.ranking.slice(0, 15);

    // Process users in parallel batches
    const batchSize = 5;
    for (let i = 0; i < usersToCheck.length; i += batchSize) {
        const batch = usersToCheck.slice(i, i + batchSize);
        const promises = batch.map(async (userRank) => {
            try {
                const userkey = `profileId:${userRank.user.profileId}`;
                const result = await fetchUserActivities(userkey);

                if (result.activities.length > 0) {
                    result.activities.forEach(activity => {
                        const authorProfileId = activity.author?.profileId;
                        const subjectProfileId = activity.subject?.profileId;
                        
                        if (activity.type === 'vouch' && authorProfileId && subjectProfileId) {
                            const uniqueId = createUniqueId(activity);

                            if (!processedActivities.has(uniqueId)) {
                                processedActivities.add(uniqueId);

                                if (gigachadProfileIds.has(subjectProfileId) &&
                                    gigachadProfileIds.has(authorProfileId) &&
                                    authorProfileId !== subjectProfileId) {

                                    const subjectUser = profileIdToUser.get(subjectProfileId);
                                    const authorUser = profileIdToUser.get(authorProfileId);

                                    if (subjectUser && authorUser) {
                                        const stakedAmount = getStakedAmount(activity);
                                        debug(`✅ Unique vouch: ${authorUser.username} -> ${subjectUser.username} (${stakedAmount} ETH)`);
                                        allVouches.push({
                                            ...activity,
                                            authorUser: authorUser,
                                            subjectUser: subjectUser,
                                            stakedAmount,
                                            uniqueId: uniqueId
                                        });
                                    }
                                }
                            }
                        }
                    });
                }
            } catch (error) {
                debug(`Error for ${userRank.user.username}:`, error.message);
            }
        });

        await Promise.all(promises);
        
        // Small delay between batches
        if (i + batchSize < usersToCheck.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    allVouches.sort((a, b) =>
        new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)
    );
    
    debug('Total vouches fetched (no duplicates)', { count: allVouches.length });
    return allVouches.slice(0, MAX_ITEMS);
}

// ========== Rendu HTML ==========

function createVouchHTML(vouch) {
    const translatedTitle = vouch.translation?.translatedContent || vouch.comment || 'Vouch';
    const subjectName = vouch.subjectUser.displayName || vouch.subjectUser.username;
    const authorName = vouch.authorUser.displayName || vouch.authorUser.username;
    const authorAvatar = vouch.authorUser.avatarUrl || 'https://via.placeholder.com/46';
    const subjectAvatar = vouch.subjectUser.avatarUrl || 'https://via.placeholder.com/46';
    const timeAgo = formatTimeAgo(vouch.createdAt || vouch.timestamp);
    const stakedAmount = vouch.stakedAmount || getStakedAmount(vouch);

    // Get the vouch ID for the URL
    const vouchId = vouch.data?.id || vouch.content?.id || vouch.id;
    const url = vouchId ? `https://app.ethos.network/activity/vouch/${vouchId}` : "#";

    return `
    <a href="${url}" target="_blank" rel="noopener noreferrer" class="card-row vouch-link">
        <img class="card-avatar" src="${authorAvatar}" alt="${authorName}" loading="lazy" 
             onerror="this.src='https://via.placeholder.com/46'">
        <span class="card-arrow">→</span>
        <img class="card-avatar" src="${subjectAvatar}" alt="${subjectName}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/46'">
        <div class="card-content">
            <div class="card-line">
                <span class="card-user">${authorName}</span>
                <span class="card-verb">vouched</span>
                <span class="card-user">${subjectName}</span>
                <span class="card-amount">${stakedAmount} ETH</span>
                <span class="card-time">${timeAgo}</span>
            </div>
            <div class="card-title">${translatedTitle}</div>
        </div>
    </a>
    `;
}

function displayVouches(vouches) {
    const container = document.getElementById('vouchesList');
    if (vouches.length > 0) {
        container.innerHTML = vouches.map(createVouchHTML).join('');
    } else {
        container.innerHTML = '<div class="empty-state"><p>No recent vouches found between Giga Chads.</p></div>';
    }
}

// ========== Initialisation ==========

async function loadVouches() {
    try {
        debug('Starting vouches loading...');
        const vouches = await fetchRecentVouches();
        displayVouches(vouches);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        debug('Loading completed successfully');
    } catch (error) {
        debug('Error loading vouches', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        showError('Unable to load vouches. Check console for details.');
    }
}

async function loadFromGitHub() {
    try {
        debug('Loading from GitHub...');
        const response = await fetch(GITHUB_JSON_URL);
        if (response.ok) {
            gigachadsData = await response.json();
            debug('GitHub data loaded successfully');
            return true;
        } else {
            debug('GitHub file not found or not accessible');
            return false;
        }
    } catch (error) {
        debug('GitHub loading failed', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    debug('Initializing vouches widget...');
    const githubSuccess = await loadFromGitHub();
    if (githubSuccess) {
        await loadVouches();
    } else {
        try {
            const response = await fetch('gigachads-ranking.json');
            if (response.ok) {
                gigachadsData = await response.json();
                await loadVouches();
            } else {
                throw new Error('Local JSON file not found');
            }
        } catch (error) {
            debug('Auto-loading failed', error);
            
            const loadingEl = document.getElementById('loading');
            const contentEl = document.getElementById('content');
            
            if (loadingEl) loadingEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'block';
            
            showError('Auto-loading failed. Please check console for details.');
        }
    }
});

// ========== Refresh Function ==========

function refreshVouches() {
    debug('Refreshing vouches...');
    vouchesCache.cache.clear();
    loadVouches();
}

window.refreshVouches = refreshVouches;
