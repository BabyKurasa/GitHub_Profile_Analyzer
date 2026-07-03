// ============================================
// GITHUB PROFILE ANALYZER PRO - COMPLETE
// All features: Score & Metrics, Visual, Activity
// ============================================

// Store profile data globally
let currentProfile = null;
let currentTheme = 'dark';

// ============================================
// THEME TOGGLE
// ============================================

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    if (currentTheme === 'dark') {
        body.classList.add('light-mode');
        body.classList.remove('dark-mode');
        currentTheme = 'light';
        if (themeIcon) themeIcon.className = 'fas fa-moon';
    } else {
        body.classList.add('dark-mode');
        body.classList.remove('light-mode');
        currentTheme = 'dark';
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    }
}

// ============================================
// PAGE NAVIGATION
// ============================================

function switchPage(page) {
    const homePage = document.getElementById('home-page');
    const suggestionsPage = document.getElementById('suggestions-page');
    const activityPage = document.getElementById('activity-page');
    const featuresPage = document.getElementById('features-page');
    
    if (homePage) homePage.style.display = 'none';
    if (suggestionsPage) suggestionsPage.style.display = 'none';
    if (activityPage) activityPage.style.display = 'none';
    if (featuresPage) featuresPage.style.display = 'none';
    
    if (page === 'home') {
        if (homePage) homePage.style.display = 'flex';
        if (featuresPage) featuresPage.style.display = 'block';
    } else if (page === 'suggestions') {
        if (suggestionsPage) suggestionsPage.style.display = 'block';
        if (currentProfile) showSuggestionsPage(currentProfile);
    } else if (page === 'activity') {
        if (activityPage) activityPage.style.display = 'block';
        if (currentProfile) showActivityPage(currentProfile);
    }
    
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
    const pages = ['home', 'suggestions', 'activity'];
    const idx = pages.indexOf(page);
    if (idx !== -1) {
        const links = document.querySelectorAll('.nav-links a');
        if (links[idx]) links[idx].classList.add('active');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function searchUser(username) {
    document.getElementById('username').value = username;
    analyzeProfile();
}

// ============================================
// MAIN ANALYZE FUNCTION
// ============================================

async function analyzeProfile() {
    const username = document.getElementById("username").value.trim();
    const resultDiv = document.getElementById("result");

    if (!username) {
        showError("Please enter a GitHub username");
        return;
    }

    resultDiv.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <h3>Analyzing ${username}'s profile...</h3>
            <p style="color: #5a5a72;">Fetching repositories, languages, and insights</p>
        </div>
    `;

    try {
        const userResponse = await fetch(`https://api.github.com/users/${username}`);
        if (!userResponse.ok) {
            throw new Error(userResponse.status === 404 ? 'User not found' : 'GitHub API error');
        }
        const userData = await userResponse.json();

        const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
        if (!reposResponse.ok) throw new Error('Failed to fetch repositories');
        const reposData = await reposResponse.json();

        const eventsResponse = await fetch(`https://api.github.com/users/${username}/events?per_page=30`);
        const eventsData = eventsResponse.ok ? await eventsResponse.json() : [];

        const profile = processGitHubData(userData, reposData, eventsData);
        currentProfile = profile;
        
        displayProfile(profile);
        switchPage('home');
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || "Network error. Please check your connection.");
    }
}

// ============================================
// PROCESS GITHUB DATA
// ============================================

function processGitHubData(userData, reposData, eventsData) {
    const totalStars = reposData.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = reposData.reduce((sum, repo) => sum + repo.forks_count, 0);
    const totalWatchers = reposData.reduce((sum, repo) => sum + repo.watchers_count, 0);
    
    const languages = {};
    reposData.forEach(repo => {
        if (repo.language) {
            languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
    });
    
    const topLanguage = Object.keys(languages).length > 0 
        ? Object.keys(languages).reduce((a, b) => languages[a] > languages[b] ? a : b) 
        : 'N/A';
    
    const accountAge = Math.floor((new Date() - new Date(userData.created_at)) / (1000 * 60 * 60 * 24));
    
    const rating = calculateRating(userData, reposData, totalStars, totalForks);
    const languageScores = calculateLanguageScores(reposData);
    const consistencyScore = calculateConsistencyScore(eventsData);
    const openSourceScore = calculateOpenSourceScore(reposData);
    const streakData = calculateStreaks(eventsData);
    const activityPattern = analyzeActivityPattern(eventsData);
    const suggestions = generateSuggestions(userData, reposData, languages, totalStars);
    const activity = processActivity(eventsData);
    const repoInsights = analyzeRepos(reposData);
    const completeness = calculateCompleteness(userData, reposData);
    
    return {
        username: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        bio: userData.bio || "🚀 Developer • Open Source Enthusiast",
        company: userData.company,
        location: userData.location,
        followers: userData.followers,
        following: userData.following,
        public_repos: userData.public_repos,
        public_gists: userData.public_gists || 0,
        profile_url: userData.html_url,
        total_stars: totalStars,
        total_forks: totalForks,
        total_watchers: totalWatchers,
        top_language: topLanguage,
        account_age_days: accountAge,
        languages: languages,
        rating: rating,
        languageScores: languageScores,
        consistencyScore: consistencyScore,
        openSourceScore: openSourceScore,
        streakData: streakData,
        activityPattern: activityPattern,
        suggestions: suggestions,
        activity: activity,
        repoInsights: repoInsights,
        completeness: completeness
    };
}

// ============================================
// 1. SCORE & METRICS
// ============================================

function calculateRating(userData, reposData, totalStars, totalForks) {
    const repoScore = Math.min((userData.public_repos / 20) * 25, 25);
    const starScore = Math.min((totalStars / 50) * 25, 25);
    const forkScore = Math.min((totalForks / 20) * 15, 15);
    const followerScore = Math.min((userData.followers / 30) * 15, 15);
    
    const langCount = Object.keys(reposData.reduce((acc, repo) => {
        if (repo.language) acc[repo.language] = true;
        return acc;
    }, {})).length;
    const languageScore = Math.min((langCount / 5) * 10, 10);
    
    const accountAge = Math.floor((new Date() - new Date(userData.created_at)) / (1000 * 60 * 60 * 24));
    const ageScore = Math.min((accountAge / 365) * 5, 5);
    
    const openSourceRepos = reposData.filter(repo => repo.fork === true).length;
    const openSourceScore = Math.min((openSourceRepos / 5) * 5, 5);
    
    const totalScore = Math.round(
        repoScore + starScore + forkScore + followerScore + 
        languageScore + ageScore + openSourceScore
    );
    const finalScore = Math.min(totalScore, 100);
    
    let tier, badge, tierColor;
    if (finalScore >= 85) {
        tier = 'GitHub Legend';
        badge = '👑';
        tierColor = '#FFD700';
    } else if (finalScore >= 70) {
        tier = 'Senior Developer';
        badge = '🚀';
        tierColor = '#667eea';
    } else if (finalScore >= 55) {
        tier = 'Active Contributor';
        badge = '💪';
        tierColor = '#4BC0C0';
    } else if (finalScore >= 40) {
        tier = 'Rising Star';
        badge = '🌟';
        tierColor = '#FFCE56';
    } else if (finalScore >= 25) {
        tier = 'Getting Started';
        badge = '🌱';
        tierColor = '#8B8B9E';
    } else {
        tier = 'Newcomer';
        badge = '🌱';
        tierColor = '#8B8B9E';
    }
    
    return {
        score: finalScore,
        tier: tier,
        badge: badge,
        tierColor: tierColor,
        breakdown: {
            Repositories: Math.round(repoScore / 25 * 100),
            Stars: Math.round(starScore / 25 * 100),
            Forks: Math.round(forkScore / 15 * 100),
            Followers: Math.round(followerScore / 15 * 100),
            Languages: Math.round(languageScore / 10 * 100),
            'Open Source': Math.round(openSourceScore / 5 * 100)
        },
        metrics: {
            repoScore: Math.round(repoScore),
            starScore: Math.round(starScore),
            forkScore: Math.round(forkScore),
            followerScore: Math.round(followerScore),
            languageScore: Math.round(languageScore),
            ageScore: Math.round(ageScore),
            openSourceScore: Math.round(openSourceScore)
        }
    };
}

function calculateLanguageScores(reposData) {
    const langScores = {};
    const langCounts = {};
    
    reposData.forEach(repo => {
        if (repo.language) {
            langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
            const stars = repo.stargazers_count || 0;
            langScores[repo.language] = (langScores[repo.language] || 0) + stars;
        }
    });
    
    const maxScore = Math.max(...Object.values(langScores), 1);
    const result = {};
    Object.keys(langScores).forEach(lang => {
        const count = langCounts[lang] || 1;
        const score = (langScores[lang] / maxScore) * 100;
        result[lang] = {
            score: Math.min(Math.round(score), 100),
            repos: count
        };
    });
    
    return result;
}

function calculateConsistencyScore(eventsData) {
    if (!eventsData || eventsData.length === 0) return 0;
    
    const dateMap = {};
    eventsData.forEach(event => {
        const date = new Date(event.created_at).toDateString();
        dateMap[date] = (dateMap[date] || 0) + 1;
    });
    
    const dates = Object.keys(dateMap).sort();
    if (dates.length < 2) return 0;
    
    let maxStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
        const diff = (new Date(dates[i]) - new Date(dates[i-1])) / (1000 * 60 * 60 * 24);
        if (diff <= 2) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }
    
    const score = Math.min(Math.round((maxStreak / 30) * 100), 100);
    return score;
}

function calculateOpenSourceScore(reposData) {
    const forkedRepos = reposData.filter(repo => repo.fork === true);
    if (forkedRepos.length === 0) return 0;
    
    let score = 0;
    forkedRepos.forEach(repo => {
        score += 10;
        score += Math.min(repo.stargazers_count || 0, 50);
    });
    
    return Math.min(Math.round(score / 10), 100);
}

function calculateStreaks(eventsData) {
    if (!eventsData || eventsData.length === 0) {
        return { currentStreak: 0, longestStreak: 0, totalCommits: 0 };
    }
    
    const pushEvents = eventsData.filter(e => e.type === 'PushEvent');
    const totalCommits = pushEvents.reduce((sum, e) => sum + (e.payload.commits ? e.payload.commits.length : 0), 0);
    
    const commitDates = pushEvents.map(e => new Date(e.created_at).toDateString());
    const uniqueDates = [...new Set(commitDates)].sort();
    
    if (uniqueDates.length === 0) {
        return { currentStreak: 0, longestStreak: 0, totalCommits: 0 };
    }
    
    let longestStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < uniqueDates.length; i++) {
        const diff = (new Date(uniqueDates[i]) - new Date(uniqueDates[i-1])) / (1000 * 60 * 60 * 24);
        if (diff <= 2) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }
    
    const today = new Date().toDateString();
    let current = 0;
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
        const diff = (new Date(today) - new Date(uniqueDates[i])) / (1000 * 60 * 60 * 24);
        if (diff <= 2) {
            current++;
        } else {
            break;
        }
    }
    
    return {
        currentStreak: current,
        longestStreak: longestStreak,
        totalCommits: totalCommits
    };
}

function analyzeActivityPattern(eventsData) {
    if (!eventsData || eventsData.length === 0) {
        return { peakHour: 'N/A', peakDay: 'N/A', activityLevel: 'Low' };
    }
    
    const hourMap = {};
    const dayMap = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    eventsData.forEach(event => {
        const date = new Date(event.created_at);
        const hour = date.getHours();
        const day = days[date.getDay()];
        hourMap[hour] = (hourMap[hour] || 0) + 1;
        dayMap[day] = (dayMap[day] || 0) + 1;
    });
    
    let maxHour = 0, peakHour = 'N/A';
    Object.keys(hourMap).forEach(hour => {
        if (hourMap[hour] > maxHour) {
            maxHour = hourMap[hour];
            peakHour = `${hour}:00`;
        }
    });
    
    let maxDay = 0, peakDay = 'N/A';
    Object.keys(dayMap).forEach(day => {
        if (dayMap[day] > maxDay) {
            maxDay = dayMap[day];
            peakDay = day;
        }
    });
    
    const totalEvents = eventsData.length;
    let activityLevel = 'Low';
    if (totalEvents > 20) activityLevel = 'Very High';
    else if (totalEvents > 10) activityLevel = 'High';
    else if (totalEvents > 5) activityLevel = 'Medium';
    
    return { peakHour, peakDay, activityLevel };
}

function analyzeRepos(reposData) {
    const insights = {
        active: [],
        abandoned: [],
        impactful: [],
        techStack: new Set()
    };
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    reposData.forEach(repo => {
        if (repo.language) insights.techStack.add(repo.language);
        
        const lastPush = new Date(repo.pushed_at);
        if (lastPush < sixMonthsAgo && repo.fork === false) {
            insights.abandoned.push(repo.name);
        } else if (repo.fork === false) {
            insights.active.push(repo.name);
        }
        
        const impact = (repo.stargazers_count || 0) + (repo.forks_count || 0) * 2;
        if (impact > 50) {
            insights.impactful.push({
                name: repo.name,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                impact: impact
            });
        }
    });
    
    insights.impactful.sort((a, b) => b.impact - a.impact);
    insights.techStack = Array.from(insights.techStack);
    
    return insights;
}

function calculateCompleteness(userData, reposData) {
    const items = [
        { label: 'Has Bio', done: userData.bio && userData.bio.length > 5 },
        { label: 'Has Avatar', done: userData.avatar_url && userData.avatar_url.length > 0 },
        { label: 'Has Location', done: userData.location && userData.location.length > 0 },
        { label: 'Has Company', done: userData.company && userData.company.length > 0 },
        { label: 'Has Repos', done: userData.public_repos > 0 },
        { label: 'Has Stars', done: reposData.reduce((sum, r) => sum + r.stargazers_count, 0) > 0 }
    ];
    
    const done = items.filter(item => item.done).length;
    const percentage = Math.round((done / items.length) * 100);
    
    return { items, percentage };
}

// ============================================
// SUGGESTIONS GENERATOR
// ============================================

function generateSuggestions(userData, reposData, languages, totalStars) {
    const suggestions = [];
    
    if (userData.public_repos < 3) {
        suggestions.push({
            icon: '📦',
            title: 'Create more repositories',
            description: 'Having more repositories showcases your skills and experience.',
            action: 'Start a new project and push it to GitHub',
            priority: 'high'
        });
    }
    
    if (totalStars < 10 && userData.public_repos > 0) {
        suggestions.push({
            icon: '⭐',
            title: 'Improve repository quality',
            description: 'Your repositories have few stars. Add documentation and examples.',
            action: 'Write a detailed README and add demo screenshots',
            priority: 'medium'
        });
    }
    
    const langCount = Object.keys(languages).length;
    if (langCount < 3) {
        suggestions.push({
            icon: '🔤',
            title: 'Explore new languages',
            description: 'You use few programming languages. Expand your skillset.',
            action: 'Try learning Python, JavaScript, or TypeScript',
            priority: 'low'
        });
    }
    
    if (!userData.bio || userData.bio.length < 10) {
        suggestions.push({
            icon: '✏️',
            title: 'Add a bio',
            description: 'A good bio helps others understand who you are and what you do.',
            action: 'Write a short bio describing your skills and interests',
            priority: 'medium'
        });
    }
    
    if (!userData.location) {
        suggestions.push({
            icon: '📍',
            title: 'Add your location',
            description: 'Location helps others find developers in your area.',
            action: 'Add your city and country to your profile',
            priority: 'low'
        });
    }
    
    if (userData.followers < 5 && userData.public_repos > 0) {
        suggestions.push({
            icon: '🤝',
            title: 'Engage with the community',
            description: 'Contribute to open source projects to gain visibility.',
            action: 'Find open issues on popular repos and submit PRs',
            priority: 'high'
        });
    }
    
    if (userData.public_repos > 5) {
        suggestions.push({
            icon: '📌',
            title: 'Pin your best repositories',
            description: 'Pinned repos appear at the top of your profile.',
            action: 'Go to your profile and pin your top 6 repositories',
            priority: 'low'
        });
    }
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const abandoned = reposData.filter(repo => 
        new Date(repo.pushed_at) < sixMonthsAgo && repo.fork === false
    );
    if (abandoned.length > 3) {
        suggestions.push({
            icon: '🗄️',
            title: 'Some repos need attention',
            description: `${abandoned.length} repositories haven't been updated in 6+ months.`,
            action: 'Update your old projects or archive them',
            priority: 'medium'
        });
    }
    
    if (suggestions.length === 0) {
        suggestions.push({
            icon: '🎉',
            title: 'Great profile!',
            description: 'Your GitHub profile looks fantastic. Keep up the great work!',
            action: 'Continue contributing and building your portfolio',
            priority: 'low'
        });
    }
    
    return {
        overall: {
            message: `Here are some ways to improve your GitHub profile`,
            icon: '💡'
        },
        suggestions: suggestions.slice(0, 8)
    };
}

// ============================================
// ACTIVITY PROCESSING
// ============================================

function processActivity(eventsData) {
    if (!eventsData || eventsData.length === 0) return [];
    
    const eventIcons = {
        'PushEvent': 'fa-code-commit',
        'CreateEvent': 'fa-plus-circle',
        'WatchEvent': 'fa-star',
        'ForkEvent': 'fa-code-branch',
        'IssuesEvent': 'fa-exclamation-circle',
        'PullRequestEvent': 'fa-code-pull-request',
        'DeleteEvent': 'fa-trash',
        'PublicEvent': 'fa-globe',
        'PullRequestReviewEvent': 'fa-comment',
        'CommitCommentEvent': 'fa-comment',
        'IssueCommentEvent': 'fa-comment',
        'ReleaseEvent': 'fa-tag'
    };
    
    const eventNames = {
        'PushEvent': 'Pushed code',
        'CreateEvent': 'Created repository',
        'WatchEvent': 'Starred repository',
        'ForkEvent': 'Forked repository',
        'IssuesEvent': 'Opened issue',
        'PullRequestEvent': 'Opened pull request',
        'DeleteEvent': 'Deleted repository',
        'PublicEvent': 'Made repository public',
        'PullRequestReviewEvent': 'Reviewed pull request',
        'CommitCommentEvent': 'Commented on commit',
        'IssueCommentEvent': 'Commented on issue',
        'ReleaseEvent': 'Published release'
    };
    
    return eventsData.map(event => ({
        type: eventNames[event.type] || event.type,
        icon: eventIcons[event.type] || 'fa-code',
        repo: event.repo.name,
        created_at: event.created_at,
        url: `https://github.com/${event.repo.name}`
    }));
}

// ============================================
// DISPLAY PROFILE
// ============================================

function displayProfile(profile) {
    const resultDiv = document.getElementById("result");
    
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num;
    };

    const hasLanguages = profile.languages && Object.keys(profile.languages).length > 0;
    const rating = profile.rating;
    const suggestions = profile.suggestions;
    const repoInsights = profile.repoInsights || { active: [], abandoned: [], impactful: [], techStack: [] };
    const streakData = profile.streakData || { currentStreak: 0, longestStreak: 0, totalCommits: 0 };
    const activityPattern = profile.activityPattern || { peakHour: 'N/A', peakDay: 'N/A', activityLevel: 'Low' };
    const languageScores = profile.languageScores || {};
    const completeness = profile.completeness || { items: [], percentage: 0 };

    resultDiv.innerHTML = `
        <div class="profile-card">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
                <button onclick="toggleTheme()" style="background: rgba(255,255,255,0.1); border: none; padding: 0.5rem 1rem; border-radius: 8px; color: #e4e4e7; cursor: pointer;">
                    <i id="themeIcon" class="fas fa-sun"></i> <span id="themeLabel">Light Mode</span>
                </button>
            </div>

            <div class="page-nav-buttons">
                <button class="page-nav-btn active" onclick="showProfileTab('profile')">
                    <i class="fas fa-user"></i> Profile
                </button>
                <button class="page-nav-btn" onclick="showProfileTab('suggestions')">
                    <i class="fas fa-lightbulb"></i> Suggestions (${suggestions.suggestions.length})
                </button>
                <button class="page-nav-btn" onclick="showProfileTab('activity')">
                    <i class="fas fa-clock"></i> Activity
                </button>
                <button class="page-nav-btn" onclick="showProfileTab('chart')">
                    <i class="fas fa-chart-pie"></i> Languages
                </button>
                <button class="page-nav-btn" onclick="showProfileTab('metrics')">
                    <i class="fas fa-chart-line"></i> Metrics
                </button>
            </div>

            <div id="profile-tab">
                <div class="profile-header">
                    <img 
                        src="${profile.avatar_url}" 
                        alt="${profile.username}'s avatar" 
                        class="profile-avatar"
                        onerror="this.src='https://ui-avatars.com/api/?name=${profile.username}&background=667eea&color=fff&size=120'"
                    />
                    <div class="profile-info">
                        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                            <h2>${profile.name || profile.username}</h2>
                            <span style="background: ${rating.tierColor}22; border: 2px solid ${rating.tierColor}; color: ${rating.tierColor}; padding: 0.3rem 1rem; border-radius: 50px; font-weight: 700; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.5rem;">
                                ${rating.badge} ${rating.tier}
                                <span style="background: ${rating.tierColor}; color: #0a0a0f; padding: 0.1rem 0.5rem; border-radius: 20px; font-size: 0.8rem;">${rating.score}/100</span>
                            </span>
                        </div>
                        <div class="username">
                            <i class="fab fa-github"></i> @${profile.username}
                        </div>
                        <div class="bio">${profile.bio}</div>
                        <div style="margin-top: 0.8rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                            ${profile.company ? `<span style="background: rgba(255,255,255,0.05); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem;"><i class="fas fa-building"></i> ${profile.company}</span>` : ''}
                            ${profile.location ? `<span style="background: rgba(255,255,255,0.05); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem;"><i class="fas fa-map-marker-alt"></i> ${profile.location}</span>` : ''}
                        </div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 1rem 1.5rem; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                        <span><i class="fas fa-check-circle" style="color: #4BC0C0;"></i> Profile Completeness</span>
                        <span style="font-weight: 700;">${completeness.percentage}%</span>
                    </div>
                    <div style="margin-top: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 50px; height: 6px; overflow: hidden;">
                        <div style="width: ${completeness.percentage}%; height: 100%; background: linear-gradient(90deg, #667eea, #4BC0C0); border-radius: 50px; transition: width 1s ease;"></div>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap; font-size: 0.8rem; color: #8b8b9e;">
                        ${completeness.items.map(item => `
                            <span>${item.done ? '✅' : '❌'} ${item.label}</span>
                        `).join('')}
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="margin-bottom: 1rem; text-align: center;">📊 Rating Breakdown</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
                        ${Object.entries(rating.breakdown || {}).map(([key, value]) => `
                            <div style="text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: #667eea;">${value}%</div>
                                <div style="color: #5a5a72; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 1rem; background: rgba(255,255,255,0.05); border-radius: 50px; height: 8px; overflow: hidden;">
                        <div style="width: ${rating.score}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2, #f093fb); border-radius: 50px; transition: width 1s ease;"></div>
                    </div>
                </div>

                <div class="profile-stats-grid">
                    <div class="stat-item"><div class="stat-value">${formatNumber(profile.followers)}</div><div class="stat-label"><i class="fas fa-users"></i> Followers</div></div>
                    <div class="stat-item"><div class="stat-value">${formatNumber(profile.following)}</div><div class="stat-label"><i class="fas fa-user-plus"></i> Following</div></div>
                    <div class="stat-item"><div class="stat-value">${profile.public_repos}</div><div class="stat-label"><i class="fas fa-code"></i> Repositories</div></div>
                    <div class="stat-item"><div class="stat-value">${profile.public_gists || 0}</div><div class="stat-label"><i class="fas fa-paste"></i> Gists</div></div>
                    <div class="stat-item"><div class="stat-value">${profile.total_stars || 0}</div><div class="stat-label"><i class="fas fa-star"></i> Total Stars</div></div>
                    <div class="stat-item"><div class="stat-value">${profile.total_forks || 0}</div><div class="stat-label"><i class="fas fa-code-branch"></i> Forks</div></div>
                    <div class="stat-item"><div class="stat-value">${profile.top_language || "N/A"}</div><div class="stat-label"><i class="fas fa-terminal"></i> Top Language</div></div>
                    <div class="stat-item"><div class="stat-value">${profile.account_age_days || 0}</div><div class="stat-label"><i class="fas fa-calendar-alt"></i> Days on GitHub</div></div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin: 1.5rem 0; background: rgba(255,255,255,0.03); border-radius: 16px; padding: 1.5rem; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #FFCE56;">${streakData.currentStreak}</div>
                        <div style="color: #5a5a72; font-size: 0.8rem;">🔥 Current Streak</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #4BC0C0;">${streakData.longestStreak}</div>
                        <div style="color: #5a5a72; font-size: 0.8rem;">🏆 Longest Streak</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #667eea;">${streakData.totalCommits}</div>
                        <div style="color: #5a5a72; font-size: 0.8rem;">📝 Total Commits</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: 700; color: #f093fb;">${activityPattern.activityLevel}</div>
                        <div style="color: #5a5a72; font-size: 0.8rem;">⚡ Activity Level</div>
                    </div>
                </div>

                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem; justify-content: center;">
                    <a href="${profile.profile_url}" target="_blank" class="profile-link">
                        <i class="fab fa-github"></i> View Profile
                    </a>
                    <button onclick='exportProfile(${JSON.stringify(profile).replace(/'/g, "\\'")})' class="profile-link" style="background: #2d3748; border: none; cursor: pointer;">
                        <i class="fas fa-download"></i> Export JSON
                    </button>
                </div>
            </div>

            <div id="suggestions-tab" style="display: none;">
                ${buildSuggestionsHTML(profile.suggestions)}
            </div>

            <div id="activity-tab" style="display: none;">
                ${buildActivityHTML(profile.activity, profile.username)}
            </div>

            <div id="chart-tab" style="display: none;">
                ${hasLanguages ? `
                <div id="chart-container" style="margin-top: 1rem;">
                    <h3 style="margin-bottom: 1rem; text-align: center;">📊 Language Distribution</h3>
                    <div style="max-width: 400px; margin: 0 auto;">
                        <canvas id="languageChart"></canvas>
                    </div>
                </div>
                ` : '<p style="text-align:center; color:#5a5a72;">No language data available</p>'}
            </div>

            <div id="metrics-tab" style="display: none;">
                ${buildMetricsHTML(profile)}
            </div>
        </div>
    `;

    if (hasLanguages) {
        setTimeout(() => {
            createLanguageChart(profile.languages);
        }, 100);
    }

    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// BUILD SUGGESTIONS HTML
// ============================================

function buildSuggestionsHTML(suggestions) {
    if (!suggestions || suggestions.suggestions.length === 0) {
        return `
            <div style="text-align: center; padding: 3rem;">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: #4BC0C0;"></i>
                <h3>🎉 No suggestions needed!</h3>
                <p style="color: #8b8b9e;">Your profile looks great!</p>
            </div>
        `;
    }
    
    return `
        <div style="margin-top: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                <span style="font-size: 1.5rem;">${suggestions.overall.icon || '💡'}</span>
                <h3 style="margin: 0;">Profile Suggestions</h3>
                <span style="background: rgba(102,126,234,0.2); padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.8rem; color: #667eea;">
                    ${suggestions.suggestions.length} tips
                </span>
            </div>
            <p style="color: #8b8b9e; margin-bottom: 1.5rem;">${suggestions.overall.message || 'Here are some ways to improve your GitHub profile:'}</p>
            <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                ${suggestions.suggestions.map((suggestion) => `
                    <div class="suggestion-card ${suggestion.priority}">
                        <div style="font-size: 1.5rem;">${suggestion.icon}</div>
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                <strong>${suggestion.title}</strong>
                                <span style="background: ${suggestion.priority === 'high' ? '#ef444422' : suggestion.priority === 'medium' ? '#f59e0b22' : '#667eea22'}; color: ${suggestion.priority === 'high' ? '#ef4444' : suggestion.priority === 'medium' ? '#f59e0b' : '#667eea'}; padding: 0.1rem 0.6rem; border-radius: 20px; font-size: 0.7rem; text-transform: uppercase; font-weight: 600;">${suggestion.priority}</span>
                            </div>
                            <p style="color: #8b8b9e; font-size: 0.9rem; margin: 0.3rem 0;">${suggestion.description}</p>
                            <div style="background: rgba(255,255,255,0.05); padding: 0.3rem 0.8rem; border-radius: 8px; font-size: 0.8rem; color: #667eea; display: inline-block; margin-top: 0.3rem;">
                                <i class="fas fa-lightbulb"></i> ${suggestion.action}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ============================================
// BUILD ACTIVITY HTML
// ============================================

function buildActivityHTML(activity, username) {
    if (!activity || activity.length === 0) {
        return `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: #5a5a72; margin-bottom: 1rem;"></i>
                <h4 style="color: #8b8b9e; margin-top: 0.5rem;">No Recent Activity</h4>
                <p style="color: #5a5a72; font-size: 0.95rem; max-width: 400px; margin: 0.5rem auto;">
                    @${username} hasn't created any public events recently.
                </p>
            </div>
        `;
    }
    
    return `
        <div style="margin-top: 1rem;">
            <h3 style="margin-bottom: 1rem;">📈 Recent Activity for @${username}</h3>
            ${activity.slice(0, 15).map(activityItem => {
                const timeAgo = getTimeAgo(new Date(activityItem.created_at));
                return `
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 0.5rem; transition: all 0.3s ease;" 
                         onmouseover="this.style.background='rgba(255,255,255,0.05)'" 
                         onmouseout="this.style.background='rgba(255,255,255,0.02)'">
                        <i class="fas ${activityItem.icon}" style="color: #667eea; width: 20px; font-size: 1.1rem;"></i>
                        <div style="flex: 1;">
                            <span style="font-weight: 600;">${activityItem.type}</span>
                            <span style="color: #8b8b9e; font-size: 0.9rem;">on <span style="color: #667eea;">${activityItem.repo}</span></span>
                        </div>
                        <span style="color: #5a5a72; font-size: 0.8rem; white-space: nowrap;">${timeAgo}</span>
                    </div>
                `;
            }).join('')}
            ${activity.length > 15 ? `<p style="text-align: center; color: #5a5a72; margin-top: 1rem; font-size: 0.85rem;">Showing 15 of ${activity.length} events</p>` : ''}
        </div>
    `;
}

// ============================================
// BUILD METRICS HTML
// ============================================

function buildMetricsHTML(profile) {
    const rating = profile.rating;
    const languageScores = profile.languageScores || {};
    const repoInsights = profile.repoInsights || { active: [], abandoned: [], impactful: [], techStack: [] };
    
    return `
        <div style="margin-top: 1rem;">
            <h3 style="margin-bottom: 1.5rem;">📊 Detailed Metrics</h3>
            
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="margin-bottom: 1rem;">Developer Score Breakdown</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
                    ${Object.entries(rating.metrics || {}).map(([key, value]) => `
                        <div style="display: flex; justify-content: space-between; padding: 0.3rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: #8b8b9e; font-size: 0.9rem;">${key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span style="font-weight: 600;">${value}/25</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${Object.keys(languageScores).length > 0 ? `
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="margin-bottom: 1rem;">Language Proficiency Scores</h4>
                ${Object.entries(languageScores).map(([lang, data]) => `
                    <div style="margin-bottom: 0.8rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                            <span>${lang}</span>
                            <span>${data.score}% (${data.repos} repos)</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); border-radius: 50px; height: 4px; overflow: hidden;">
                            <div style="width: ${data.score}%; height: 100%; background: linear-gradient(90deg, #667eea, #f093fb); border-radius: 50px;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="margin-bottom: 1rem;">Repository Insights</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <div style="color: #4BC0C0;">✅ Active Repos</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">${repoInsights.active.length}</div>
                    </div>
                    <div>
                        <div style="color: #FF6384;">🗄️ Abandoned Repos</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">${repoInsights.abandoned.length}</div>
                    </div>
                    <div>
                        <div style="color: #FFCE56;">⭐ Impactful Repos</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">${repoInsights.impactful.length}</div>
                    </div>
                    <div>
                        <div style="color: #667eea;">💻 Tech Stack</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">${repoInsights.techStack.length}</div>
                    </div>
                </div>
                ${repoInsights.techStack.length > 0 ? `
                    <div style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${repoInsights.techStack.slice(0, 10).map(tech => `
                            <span style="background: rgba(102,126,234,0.2); padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.8rem; color: #667eea;">${tech}</span>
                        `).join('')}
                        ${repoInsights.techStack.length > 10 ? `<span style="color: #5a5a72; font-size: 0.8rem;">+${repoInsights.techStack.length - 10} more</span>` : ''}
                    </div>
                ` : ''}
            </div>
            
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 1.5rem; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="margin-bottom: 1rem;">Activity Pattern</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: 700; color: #667eea;">${profile.activityPattern.peakHour}</div>
                        <div style="color: #5a5a72; font-size: 0.8rem;">🕐 Peak Hour</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: 700; color: #f093fb;">${profile.activityPattern.peakDay}</div>
                        <div style="color: #5a5a72; font-size: 0.8rem;">📅 Peak Day</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: 700; color: #4BC0C0;">${profile.consistencyScore}%</div>
                        <div style="color: #5a5a72; font-size: 0.8rem;">📊 Consistency Score</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: 700; color: #FFCE56;">${profile.openSourceScore}%</div>
                        <div style="color: #5a5a72; font-size: 0.8rem;">🌍 Open Source Score</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// TAB SWITCHING
// ============================================

function showProfileTab(tab) {
    const tabs = ['profile-tab', 'suggestions-tab', 'activity-tab', 'chart-tab', 'metrics-tab'];
    tabs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    const tabMap = {
        'profile': 'profile-tab',
        'suggestions': 'suggestions-tab',
        'activity': 'activity-tab',
        'chart': 'chart-tab',
        'metrics': 'metrics-tab'
    };
    const selectedTab = document.getElementById(tabMap[tab]);
    if (selectedTab) selectedTab.style.display = 'block';
    
    document.querySelectorAll('.page-nav-btn').forEach(btn => btn.classList.remove('active'));
    const btns = document.querySelectorAll('.page-nav-btn');
    const tabIndex = ['profile', 'suggestions', 'activity', 'chart', 'metrics'].indexOf(tab);
    if (btns[tabIndex]) btns[tabIndex].classList.add('active');
}

// ============================================
// SUGGESTIONS PAGE
// ============================================

function showSuggestionsPage(profile) {
    const content = document.getElementById('suggestions-content');
    if (!content) return;
    content.innerHTML = buildSuggestionsHTML(profile.suggestions);
}

// ============================================
// ACTIVITY PAGE
// ============================================

function showActivityPage(profile) {
    const content = document.getElementById('activity-content');
    if (!content) return;
    content.innerHTML = buildActivityHTML(profile.activity, profile.username);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function createLanguageChart(languages) {
    const ctx = document.getElementById('languageChart');
    if (!ctx) return;

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
    const labels = Object.keys(languages);
    const data = Object.values(languages);
    
    const sorted = labels.map((label, i) => ({ label, value: data[i] })).sort((a, b) => b.value - a.value);
    const top5 = sorted.slice(0, 5);
    const otherCount = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
    const finalLabels = top5.map(item => item.label);
    const finalData = top5.map(item => item.value);
    
    if (otherCount > 0) { finalLabels.push('Others'); finalData.push(otherCount); }

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: finalLabels,
            datasets: [{
                data: finalData,
                backgroundColor: colors.slice(0, finalLabels.length),
                borderWidth: 2,
                borderColor: '#1a1a2e'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#e4e4e7', font: { size: 12 } }
                }
            },
            cutout: '60%'
        }
    });
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
    for (const [unit, seconds] of Object.entries(intervals)) {
        const count = Math.floor(diff / seconds);
        if (count >= 1) { return `${count} ${unit}${count > 1 ? 's' : ''} ago`; }
    }
    return 'Just now';
}

function exportProfile(profile) {
    // Create a clean HTML version of the profile for PDF
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num;
    };

    const rating = profile.rating;
    const streakData = profile.streakData || { currentStreak: 0, longestStreak: 0, totalCommits: 0 };
    
    // Build HTML content for PDF
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${profile.username} - GitHub Profile Report</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: Arial, sans-serif;
                    background: #0a0a0f;
                    color: #e4e4e7;
                    padding: 40px;
                    line-height: 1.6;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: #1a1a2e;
                    padding: 40px;
                    border-radius: 16px;
                    border: 1px solid #333;
                }
                .header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }
                .avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    border: 3px solid #667eea;
                }
                .name {
                    font-size: 28px;
                    font-weight: bold;
                    color: #fff;
                }
                .username {
                    color: #667eea;
                    font-size: 16px;
                }
                .bio {
                    color: #8b8b9e;
                    margin-top: 5px;
                }
                .section {
                    margin: 20px 0;
                }
                .section-title {
                    color: #667eea;
                    font-size: 18px;
                    font-weight: bold;
                    border-bottom: 1px solid #333;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                }
                .stat-item {
                    background: #0a0a0f;
                    padding: 12px;
                    border-radius: 8px;
                    text-align: center;
                }
                .stat-value {
                    font-size: 20px;
                    font-weight: bold;
                    color: #667eea;
                }
                .stat-label {
                    color: #8b8b9e;
                    font-size: 11px;
                    margin-top: 4px;
                }
                .score-box {
                    background: #0a0a0f;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 15px 0;
                }
                .score-number {
                    font-size: 48px;
                    font-weight: bold;
                    color: #667eea;
                }
                .score-label {
                    color: #8b8b9e;
                    font-size: 14px;
                }
                .tier-badge {
                    display: inline-block;
                    background: ${rating.tierColor}22;
                    border: 2px solid ${rating.tierColor};
                    color: ${rating.tierColor};
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 14px;
                }
                .breakdown-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin: 10px 0;
                }
                .break-item {
                    background: #0a0a0f;
                    padding: 8px;
                    border-radius: 6px;
                    text-align: center;
                }
                .break-value {
                    font-weight: bold;
                    color: #fff;
                }
                .break-label {
                    color: #8b8b9e;
                    font-size: 10px;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #333;
                    text-align: center;
                    color: #5a5a72;
                    font-size: 12px;
                }
                @media print {
                    body { background: white; padding: 20px; }
                    .container { background: white; border: 1px solid #ddd; }
                    .name { color: #000; }
                    .username { color: #667eea; }
                    .bio { color: #555; }
                    .stat-item { background: #f5f5f5; }
                    .stat-value { color: #667eea; }
                    .stat-label { color: #666; }
                    .score-box { background: #f5f5f5; }
                    .score-number { color: #667eea; }
                    .break-item { background: #f5f5f5; }
                    .break-value { color: #000; }
                    .break-label { color: #666; }
                    .section-title { color: #667eea; border-bottom: 1px solid #ddd; }
                    .footer { border-top: 1px solid #ddd; color: #999; }
                    .tier-badge { background: ${rating.tierColor}22; border: 2px solid ${rating.tierColor}; color: ${rating.tierColor}; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${profile.avatar_url}" alt="${profile.username}" class="avatar" />
                    <div>
                        <div class="name">${profile.name || profile.username}</div>
                        <div class="username">@${profile.username}</div>
                        <div class="bio">${profile.bio || ''}</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">📊 Developer Score</div>
                    <div class="score-box">
                        <div class="score-number">${rating.score}/100</div>
                        <div class="score-label">
                            <span class="tier-badge">${rating.badge} ${rating.tier}</span>
                        </div>
                    </div>
                    <div class="breakdown-grid">
                        ${Object.entries(rating.breakdown || {}).map(([key, value]) => `
                            <div class="break-item">
                                <div class="break-value">${value}%</div>
                                <div class="break-label">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">📈 Statistics</div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${formatNumber(profile.followers)}</div>
                            <div class="stat-label">Followers</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${profile.public_repos}</div>
                            <div class="stat-label">Repositories</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${profile.total_stars || 0}</div>
                            <div class="stat-label">Total Stars</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${profile.total_forks || 0}</div>
                            <div class="stat-label">Total Forks</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${profile.top_language || 'N/A'}</div>
                            <div class="stat-label">Top Language</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${streakData.currentStreak}</div>
                            <div class="stat-label">Current Streak</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${streakData.longestStreak}</div>
                            <div class="stat-label">Longest Streak</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${profile.account_age_days || 0}</div>
                            <div class="stat-label">Days on GitHub</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">🔍 Activity Pattern</div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${profile.activityPattern?.peakHour || 'N/A'}</div>
                            <div class="stat-label">Peak Hour</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${profile.activityPattern?.peakDay || 'N/A'}</div>
                            <div class="stat-label">Peak Day</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${profile.consistencyScore || 0}%</div>
                            <div class="stat-label">Consistency</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${profile.openSourceScore || 0}%</div>
                            <div class="stat-label">Open Source</div>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    Generated by GitHub Profile Analyzer Pro
                    <br />${new Date().toLocaleDateString()} • ${new Date().toLocaleTimeString()}
                    <br />https://babykurasa.github.io/github-profile-analyzer/
                </div>
            </div>
        </body>
        </html>
    `;

    // Create a Blob from the HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for printing/saving as PDF
    const printWindow = window.open(url, '_blank', 'width=800,height=600');
    
    if (printWindow) {
        printWindow.onload = function() {
            setTimeout(function() {
                printWindow.print();
            }, 500);
        };
    } else {
        alert('Please allow popups to generate the PDF report.');
    }
    
    // Clean up
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 10000);
}
function showError(message) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <h3>${message}</h3>
            <p style="color: #5a5a72; margin-top: 0.5rem;">Try searching for another username</p>
        </div>
    `;
}
