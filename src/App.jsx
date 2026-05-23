import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { mapVideoPromptRow, mapVideoPromptToRow, videoPrompts } from './data/videoPrompts';
import { supabase, supabaseSetupMessage } from './supabaseClient';

const platformFilters = [
  { label: 'All', value: 'all' },
  { label: 'Midjourney', value: 'Midjourney' },
  { label: 'Runway', value: 'Runway' },
  { label: 'Sora', value: 'Sora' },
];

const categoryFilters = ['All', 'Ad', 'Film', 'Music Video', 'Shorts', 'Brand', 'Animation'];

const initialAdminForm = {
  title: '',
  platform: '',
  category: '',
  prompt: '',
  thumbnailUrl: '',
  videoUrl: '',
  difficulty: '',
  tags: '',
};

const initialLoginForm = {
  email: '',
  password: '',
  confirmPassword: '',
};

const platformOptions = [
  { label: 'Midjourney', value: 'Midjourney' },
  { label: 'Runway', value: 'Runway' },
  { label: 'Sora', value: 'Sora' },
];

const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const videoPromptColumns =
  'id,title,platform,category,prompt,thumbnail_url,video_url,difficulty,tags,likes,created_at';

const getPreviewPrompts = (prompts, count = 5) => {
  const seenIds = new Set();
  const combinedPrompts = [...prompts, ...videoPrompts].filter((prompt) => {
    if (seenIds.has(prompt.id)) {
      return false;
    }

    seenIds.add(prompt.id);
    return true;
  });

  return combinedPrompts.slice(0, count);
};

const getFriendlyAuthError = (error, mode) => {
  const message = error?.message ?? '';
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('invalid login credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않습니다. 계정이 없다면 먼저 회원가입을 진행해주세요.';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return '이메일 확인이 완료되지 않았습니다. 메일함의 확인 링크를 먼저 열어주세요.';
  }

  if (normalizedMessage.includes('user already registered') || normalizedMessage.includes('already registered')) {
    return '이미 가입된 이메일입니다. 로그인 화면에서 로그인해주세요.';
  }

  if (normalizedMessage.includes('signup is disabled')) {
    return 'Supabase에서 이메일 회원가입이 비활성화되어 있습니다. Authentication > Providers > Email 설정을 확인해주세요.';
  }

  return `${mode === 'signup' ? '회원가입' : '로그인'} 실패: ${message}`;
};

const buttonMotion = {
  whileHover: { y: -2, scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 420, damping: 28 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: index * 0.045, duration: 0.42, ease: 'easeOut' },
  }),
  exit: { opacity: 0, y: 14, filter: 'blur(6px)', transition: { duration: 0.18 } },
};

function LoadingState({ title = 'Loading...', description = 'Please wait a moment.' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function Header({ session, onSignOut, isSigningOut }) {
  const getNavClass = ({ isActive }) => (isActive ? 'active' : undefined);

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="AI 영상 프롬프트 포트폴리오 홈">
        <span className="brand-mark">AI</span>
        <span>Video Prompt Portfolio</span>
      </Link>

      <nav className="nav-links" aria-label="주요 메뉴">
        <NavLink to="/" end className={getNavClass}>Home</NavLink>
        <NavLink to="/prompts" className={getNavClass}>Prompts</NavLink>
        <NavLink to="/categories" className={getNavClass}>Categories</NavLink>
        <NavLink to="/ranking" className={getNavClass}>Ranking</NavLink>
        <NavLink to="/admin" className={getNavClass}>Admin</NavLink>
        {session ? (
          <button className="nav-auth-button" type="button" onClick={onSignOut} disabled={isSigningOut}>
            {isSigningOut ? 'Signing out' : 'Logout'}
          </button>
        ) : (
          <>
            <NavLink to="/login" className={getNavClass}>Login</NavLink>
            <NavLink to="/signup" className={getNavClass}>Sign up</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
function ProtectedRoute({ session, isAuthLoading, children }) {
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <main>
        <section className="content-section">
          <LoadingState
            title="관리자 세션을 확인하고 있습니다."
            description="로그인 상태를 복원하는 중입니다."
          />
        </section>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function LoginPage({
  mode = 'login',
  session,
  isAuthLoading,
  loginForm,
  authError,
  authMessage,
  isSubmittingAuth,
  handleLoginInputChange,
  handleAuthSubmit,
}) {
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? '/admin';
  const isSignUpMode = mode === 'signup';
  const isResetMode = mode === 'reset';

  if (session) {
    return <Navigate to={redirectTo} replace />;
  }

  const pageTitle = isResetMode ? '비밀번호 재설정' : isSignUpMode ? '관리자 회원가입' : '관리자 로그인';
  const pageDescription = isResetMode
    ? '가입한 이메일로 비밀번호 재설정 메일을 보냅니다.'
    : isSignUpMode
      ? 'Supabase Auth 이메일/비밀번호 계정으로 관리자 계정을 만듭니다.'
      : 'Supabase Auth 이메일/비밀번호 계정으로 관리자 페이지에 접근합니다.';

  return (
    <main className="auth-main">
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="section-heading">
          <p className="eyebrow">
            {isResetMode ? 'Password Reset' : isSignUpMode ? 'Admin Sign Up' : 'Admin Login'}
          </p>
          <h1 id="login-title">{pageTitle}</h1>
          <p>{pageDescription}</p>
        </div>

        <form className="auth-form" onSubmit={(event) => handleAuthSubmit(event, mode)} noValidate>
          <label>
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={loginForm.email}
              onChange={handleLoginInputChange}
              autoComplete="email"
              placeholder="admin@example.com"
            />
          </label>

          {!isResetMode && (
            <label>
              <span>Password</span>
              <input
                name="password"
                type="password"
                value={loginForm.password}
                onChange={handleLoginInputChange}
                autoComplete={isSignUpMode ? 'new-password' : 'current-password'}
                placeholder="Password"
              />
            </label>
          )}

          {isSignUpMode && !isResetMode && (
            <label>
              <span>Confirm Password</span>
              <input
                name="confirmPassword"
                type="password"
                value={loginForm.confirmPassword}
                onChange={handleLoginInputChange}
                autoComplete="new-password"
                placeholder="Confirm password"
              />
            </label>
          )}

          {authError && (
            <div className="auth-error" role="alert">
              {authError}
            </div>
          )}

          {authMessage && (
            <div className="auth-message" role="status">
              {authMessage}
            </div>
          )}

          <motion.button
            className="primary-button"
            type="submit"
            disabled={isAuthLoading || isSubmittingAuth || !supabase}
            {...buttonMotion}
          >
            {isSubmittingAuth
              ? 'Processing...'
              : isResetMode
                ? 'Send reset email'
                : isSignUpMode
                  ? 'Sign up'
                  : 'Login'}
          </motion.button>

          <div className="auth-switch">
            {isResetMode ? (
              <Link to="/login" state={location.state}>
                로그인 화면으로 돌아가기
              </Link>
            ) : isSignUpMode ? (
              <Link to="/login" state={location.state}>
                이미 계정이 있나요? 로그인
              </Link>
            ) : (
              <>
                <Link to="/signup" state={location.state}>
                  계정이 없나요? 회원가입
                </Link>
                <Link to="/reset-password" state={location.state}>
                  비밀번호를 잊으셨나요?
                </Link>
              </>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
function MediaPreview({ prompt, failedVideoIds, setFailedVideoIds, className = 'card-thumbnail' }) {
  const previewAlt = `${prompt.title} preview image for a ${prompt.platform} ${prompt.category} video prompt`;

  return (
    <div className={className}>
      {prompt.videoUrl && !failedVideoIds.includes(prompt.id) ? (
        <video
          src={prompt.videoUrl}
          poster={prompt.thumbnailUrl}
          aria-label={`${prompt.title} video preview`}
          muted
          loop
          controls
          playsInline
          onError={() =>
            setFailedVideoIds((currentIds) =>
              currentIds.includes(prompt.id) ? currentIds : [...currentIds, prompt.id],
            )
          }
        >
          <img src={prompt.thumbnailUrl} alt={previewAlt} loading="lazy" />
        </video>
      ) : (
        <img src={prompt.thumbnailUrl} alt={previewAlt} loading="lazy" />
      )}
      {className === 'card-thumbnail' && <span>{prompt.platform}</span>}
    </div>
  );
}

function PromptCard({
  prompt,
  index,
  likedPromptIds,
  likeUpdatingIds,
  getLikeCount,
  toggleLike,
  failedVideoIds,
  setFailedVideoIds,
}) {
  const navigate = useNavigate();
  const isUpdatingLike = likeUpdatingIds.includes(prompt.id);

  const openDetail = () => navigate(`/prompts/${prompt.id}`);

  return (
    <motion.article
      className="prompt-card"
      role="button"
      tabIndex={0}
      layout
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ y: -8, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      onClick={openDetail}
      aria-label={`${prompt.title} 프롬프트 상세 보기`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetail();
        }
      }}
    >
      <div onClick={(event) => event.stopPropagation()}>
        <MediaPreview
          prompt={prompt}
          failedVideoIds={failedVideoIds}
          setFailedVideoIds={setFailedVideoIds}
        />
      </div>

      <div className="card-body">
        <div className="card-topline">
          <span>{prompt.category}</span>
          <span>{prompt.difficulty}</span>
        </div>
        <h3>{prompt.title}</h3>
        <p className="prompt-text">{prompt.prompt}</p>
      </div>

      <div className="card-meta">
        <span>{prompt.createdAt}</span>
        <motion.button
          className={`like-button ${likedPromptIds.includes(prompt.id) ? 'liked' : ''}`}
          type="button"
          disabled={isUpdatingLike}
          onClick={(event) => {
            event.stopPropagation();
            toggleLike(prompt.id);
          }}
          aria-pressed={likedPromptIds.includes(prompt.id)}
          aria-label={`${prompt.title} 좋아요`}
          {...buttonMotion}
        >
          <span aria-hidden="true">♥</span>
          {getLikeCount(prompt).toLocaleString()}
        </motion.button>
      </div>

      <div className="tag-list" aria-label={`${prompt.title} 태그`}>
        {prompt.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </motion.article>
  );
}
function PromptGrid({
  prompts,
  isLoading,
  likedPromptIds,
  likeUpdatingIds,
  getLikeCount,
  toggleLike,
  failedVideoIds,
  setFailedVideoIds,
}) {
  if (isLoading) {
    return (
      <LoadingState
        title="프롬프트를 불러오는 중입니다."
        description="Supabase에서 최신 포트폴리오 데이터를 가져오고 있습니다."
      />
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="empty-state">
        <strong>검색 결과가 없습니다.</strong>
        <span>검색어를 바꾸거나 다른 플랫폼, 카테고리 필터를 선택해 주세요.</span>
      </div>
    );
  }

  return (
    <motion.div className="card-grid" layout>
      <AnimatePresence mode="popLayout">
        {prompts.map((prompt, index) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            index={index}
            likedPromptIds={likedPromptIds}
            likeUpdatingIds={likeUpdatingIds}
            getLikeCount={getLikeCount}
            toggleLike={toggleLike}
            failedVideoIds={failedVideoIds}
            setFailedVideoIds={setFailedVideoIds}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
function Hero({ promptCount }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-glow hero-glow-cyan" aria-hidden="true" />
      <div className="hero-glow hero-glow-pink" aria-hidden="true" />
      <div className="hero-deco hero-deco-ring" aria-hidden="true" />
      <div className="hero-deco hero-deco-line" aria-hidden="true" />

      <div className="hero-content">
        <p className="eyebrow">Cyberpunk Prompt Lab</p>
        <h1 id="hero-title">
          AI 영상 프롬프트를
          <span>네온 포트폴리오로</span>
          기록하세요
        </h1>
        <p className="hero-copy">
          장면 콘셉트, 카메라 움직임, 조명 무드, 생성 모델별 프롬프트를 한곳에 모아
          AI 영상 작업의 아이디어와 결과물을 선명하게 보여주세요.
        </p>
        <div className="hero-actions">
          <motion.div {...buttonMotion}>
            <Link className="primary-button" to="/prompts">프롬프트 탐색하기</Link>
          </motion.div>
          <motion.div {...buttonMotion}>
            <Link className="ghost-button" to="/ranking">인기 랭킹 보기</Link>
          </motion.div>
        </div>
      </div>

      <aside className="hero-panel" aria-label="포트폴리오 지표">
        <div>
          <strong>{promptCount.toString().padStart(2, '0')}</strong>
          <span>Prompt Cards</span>
        </div>
        <div>
          <strong>4K</strong>
          <span>Visual Target</span>
        </div>
        <div>
          <strong>24fps</strong>
          <span>Cinematic Motion</span>
        </div>
      </aside>
    </section>
  );
}

function HomePage({ prompts }) {
  const featuredPrompts = getPreviewPrompts(prompts, 5);
  const categories = categoryFilters
    .filter((category) => category !== categoryFilters[0])
    .map((category) => ({
      name: category,
      count: prompts.filter((prompt) => prompt.category === category).length,
    }));
  const topPrompts = getPreviewPrompts(prompts, 5)
    .sort((firstPrompt, secondPrompt) => (secondPrompt.likes ?? 0) - (firstPrompt.likes ?? 0))
    .slice(0, 5);

  return (
    <main id="top">
      <Hero promptCount={prompts.length} />
      <section className="workflow-section" id="workflow" aria-labelledby="workflow-title">
        <div>
          <p className="eyebrow">Workflow</p>
          <h2 id="workflow-title">기획부터 결과물 정리까지</h2>
        </div>
        <div className="workflow-list">
          <span>Concept</span>
          <span>Prompt</span>
          <span>Generate</span>
          <span>Curate</span>
        </div>
      </section>

      <section className="home-preview-section" aria-labelledby="home-prompts-title">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">Prompts</p>
            <h2 id="home-prompts-title">최근 프롬프트</h2>
          </div>
          <Link className="ghost-button" to="/prompts">전체 보기</Link>
        </div>

        <div className="home-prompt-grid">
          {featuredPrompts.map((prompt) => (
            <Link className="home-prompt-card" to={`/prompts/${prompt.id}`} key={prompt.id}>
              <MediaPreview
                prompt={prompt}
                failedVideoIds={[]}
                setFailedVideoIds={() => {}}
                className="home-preview-media"
              />
              <div>
                <span>{prompt.platform} / {prompt.category}</span>
                <h3>{prompt.title}</h3>
                <p>{prompt.prompt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-preview-section" aria-labelledby="home-categories-title">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">Categories</p>
            <h2 id="home-categories-title">카테고리별 탐색</h2>
          </div>
          <Link className="ghost-button" to="/categories">카테고리 보기</Link>
        </div>

        <div className="ranking-list">
          {categories.map((category) => (
            <Link className="ranking-item" to="/categories" key={category.name}>
              <span className="ranking-number">{category.count}</span>
              <span className="ranking-title">{category.name}</span>
              <span className="ranking-platform">Prompt Category</span>
              <strong>Explore</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-preview-section" aria-labelledby="home-ranking-title">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">Ranking</p>
            <h2 id="home-ranking-title">인기 프롬프트</h2>
          </div>
          <Link className="ghost-button" to="/ranking">랭킹 보기</Link>
        </div>

        <div className="ranking-list">
          {topPrompts.map((prompt, index) => (
            <Link className="ranking-item" to={`/prompts/${prompt.id}`} key={prompt.id}>
              <span className="ranking-number">{index + 1}</span>
              <span className="ranking-title">{prompt.title}</span>
              <span className="ranking-platform">{prompt.platform}</span>
              <strong>{(prompt.likes ?? 0).toLocaleString()}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
function PromptsPage({
  prompts,
  selectedPlatform,
  setSelectedPlatform,
  selectedCategory,
  setSelectedCategory,
  searchTerm,
  setSearchTerm,
  isLoadingPrompts,
  likedPromptIds,
  likeUpdatingIds,
  getLikeCount,
  toggleLike,
  failedVideoIds,
  setFailedVideoIds,
}) {
  const filteredPrompts = prompts.filter((prompt) => {
    const matchesPlatform = selectedPlatform === 'all' || prompt.platform === selectedPlatform;
    const matchesCategory = selectedCategory === categoryFilters[0] || prompt.category === selectedCategory;
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const searchableText = [
      prompt.title,
      prompt.platform,
      prompt.category,
      prompt.prompt,
      ...prompt.tags,
    ]
      .join(' ')
      .toLowerCase();
    const matchesSearch =
      normalizedSearchTerm === '' || searchableText.includes(normalizedSearchTerm);

    return matchesPlatform && matchesCategory && matchesSearch;
  });

  return (
    <main>
      <section className="content-section" id="prompts" aria-labelledby="prompt-title">
        <div className="section-heading">
          <p className="eyebrow">Prompt Archive</p>
          <h1 id="prompt-title">프롬프트 목록 {prompts.length}개</h1>
          <p>플랫폼, 카테고리, 검색어를 조합해 원하는 AI 영상 프롬프트를 빠르게 찾을 수 있습니다.</p>
        </div>

        <div className="filter-bar" aria-label="플랫폼 필터">
          {platformFilters.map((filter) => (
            <motion.button
              className={`filter-button ${selectedPlatform === filter.value ? 'active' : ''}`}
              type="button"
              key={filter.value}
              onClick={() => setSelectedPlatform(filter.value)}
              aria-pressed={selectedPlatform === filter.value}
              {...buttonMotion}
            >
              {filter.label}
            </motion.button>
          ))}
        </div>

        <div className="filter-bar category-filter-bar" aria-label="카테고리 필터">
          {categoryFilters.map((category) => (
            <motion.button
              className={`filter-button ${selectedCategory === category ? 'active' : ''}`}
              type="button"
              key={category}
              onClick={() => setSelectedCategory(category)}
              aria-pressed={selectedCategory === category}
              {...buttonMotion}
            >
              {category}
            </motion.button>
          ))}
        </div>

        <label className="search-field">
          <span>Search prompts</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="제목, 플랫폼, 카테고리, 프롬프트, 태그 검색"
            aria-label="영상 프롬프트 검색"
          />
        </label>

        <PromptGrid
          prompts={filteredPrompts}
          isLoading={isLoadingPrompts}
          likedPromptIds={likedPromptIds}
          likeUpdatingIds={likeUpdatingIds}
          getLikeCount={getLikeCount}
          toggleLike={toggleLike}
          failedVideoIds={failedVideoIds}
          setFailedVideoIds={setFailedVideoIds}
        />
      </section>
    </main>
  );
}
function CategoriesPage({ prompts }) {
  const categories = categoryFilters.filter((category) => category !== categoryFilters[0]);

  return (
    <main>
      <section className="content-section" aria-labelledby="categories-title">
        <div className="section-heading">
          <p className="eyebrow">Categories</p>
          <h1 id="categories-title">카테고리</h1>
          <p>카테고리별 등록 프롬프트 수를 확인하고 목록 페이지에서 바로 필터링할 수 있습니다.</p>
        </div>

        <div className="ranking-list">
          {categories.map((category) => {
            const count = prompts.filter((prompt) => prompt.category === category).length;

            return (
              <Link className="ranking-item" to="/prompts" key={category}>
                <span className="ranking-number">{count}</span>
                <span className="ranking-title">{category}</span>
                <span className="ranking-platform">Prompt Category</span>
                <strong>Explore</strong>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function RankingPage({ topPrompts, getLikeCount }) {
  return (
    <main>
      <section className="content-section" aria-labelledby="ranking-page-title">
        <div className="section-heading">
          <p className="eyebrow">Trending</p>
          <h1 id="ranking-page-title">인기 프롬프트 TOP 5</h1>
          <p>좋아요 수를 기준으로 가장 반응이 좋은 AI 영상 프롬프트를 보여줍니다.</p>
        </div>

        <div className="ranking-list">
          {topPrompts.map((prompt, index) => (
            <Link className="ranking-item" to={`/prompts/${prompt.id}`} key={prompt.id}>
              <span className="ranking-number">{index + 1}</span>
              <span className="ranking-title">{prompt.title}</span>
              <span className="ranking-platform">{prompt.platform}</span>
              <strong>{getLikeCount(prompt).toLocaleString()}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
function AdminPage({
  prompts,
  adminForm,
  adminErrors,
  adminMessage,
  editingPromptId,
  isSavingPrompt,
  handleAdminInputChange,
  handleAdminSubmit,
  startEditPrompt,
  cancelEditPrompt,
  deletePrompt,
}) {
  return (
    <main className="admin-main">
      <section className="admin-section" aria-labelledby="admin-title">
        <div className="section-heading">
          <p className="eyebrow">Admin Upload</p>
          <h1 id="admin-title">{editingPromptId ? '영상 프롬프트 수정' : '영상 프롬프트 등록'}</h1>
          <p>프롬프트를 입력하면 포트폴리오 목록, 필터, 검색, 랭킹에 바로 반영됩니다.</p>
        </div>

        <form className="admin-form" onSubmit={handleAdminSubmit} noValidate>
          <label>
            <span>제목</span>
            <input name="title" value={adminForm.title} onChange={handleAdminInputChange} placeholder="예: Neon Product Launch" />
            {adminErrors.title && <em>{adminErrors.title}</em>}
          </label>

          <label>
            <span>플랫폼</span>
            <select name="platform" value={adminForm.platform} onChange={handleAdminInputChange}>
              <option value="">플랫폼 선택</option>
              {platformOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {adminErrors.platform && <em>{adminErrors.platform}</em>}
          </label>

          <label>
            <span>카테고리</span>
            <select name="category" value={adminForm.category} onChange={handleAdminInputChange}>
              <option value="">카테고리 선택</option>
              {categoryFilters
                .filter((category) => category !== categoryFilters[0])
                .map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
            </select>
            {adminErrors.category && <em>{adminErrors.category}</em>}
          </label>

          <label>
            <span>난이도</span>
            <select name="difficulty" value={adminForm.difficulty} onChange={handleAdminInputChange}>
              <option value="">난이도 선택</option>
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
            {adminErrors.difficulty && <em>{adminErrors.difficulty}</em>}
          </label>

          <label className="admin-form-wide">
            <span>프롬프트 내용</span>
            <textarea
              name="prompt"
              value={adminForm.prompt}
              onChange={handleAdminInputChange}
              placeholder="영상 장면, 카메라 움직임, 조명, 분위기를 자세히 입력하세요."
              rows="6"
            />
            {adminErrors.prompt && <em>{adminErrors.prompt}</em>}
          </label>

          <label>
            <span>썸네일 이미지 URL</span>
            <input name="thumbnailUrl" value={adminForm.thumbnailUrl} onChange={handleAdminInputChange} placeholder="https://example.com/thumbnail.jpg" />
            {adminErrors.thumbnailUrl && <em>{adminErrors.thumbnailUrl}</em>}
          </label>

          <label>
            <span>영상 URL</span>
            <input name="videoUrl" value={adminForm.videoUrl} onChange={handleAdminInputChange} placeholder="https://example.com/video.mp4" />
          </label>

          <label className="admin-form-wide">
            <span>태그</span>
            <input name="tags" value={adminForm.tags} onChange={handleAdminInputChange} placeholder="Neon, Product, Launch" />
            {adminErrors.tags && <em>{adminErrors.tags}</em>}
          </label>

          <div className="admin-actions">
            <motion.button className="primary-button" type="submit" disabled={isSavingPrompt} {...buttonMotion}>
              {isSavingPrompt ? '저장 중' : editingPromptId ? '수정 완료' : '등록'}
            </motion.button>
            {editingPromptId && (
              <motion.button className="ghost-button" type="button" onClick={cancelEditPrompt} {...buttonMotion}>
                수정 취소
              </motion.button>
            )}
            {adminMessage && <strong>{adminMessage}</strong>}
          </div>
        </form>

        <section className="admin-list-section" aria-labelledby="admin-list-title">
          <div className="ranking-heading">
            <p className="eyebrow">Manage</p>
            <h2 id="admin-list-title">등록된 프롬프트 목록</h2>
          </div>

          <div className="admin-prompt-list">
            {prompts.map((prompt) => (
              <article className="admin-prompt-item" key={prompt.id}>
                <div>
                  <span>{prompt.platform} / {prompt.category}</span>
                  <h3>{prompt.title}</h3>
                  <p>{prompt.prompt}</p>
                </div>
                <div className="admin-item-actions">
                  <motion.button className="filter-button" type="button" onClick={() => startEditPrompt(prompt)} {...buttonMotion}>
                    수정
                  </motion.button>
                  <motion.button className="delete-button" type="button" onClick={() => deletePrompt(prompt.id)} {...buttonMotion}>
                    삭제
                  </motion.button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
function PromptDetailPage({
  prompts,
  likedPromptIds,
  likeUpdatingIds,
  getLikeCount,
  toggleLike,
  failedVideoIds,
  setFailedVideoIds,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const prompt = prompts.find((item) => String(item.id) === id);
  const [copyMessage, setCopyMessage] = useState('');
  const isUpdatingLike = prompt ? likeUpdatingIds.includes(prompt.id) : false;

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        navigate('/prompts');
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [navigate]);

  if (!prompt) {
    return <NotFoundPage />;
  }

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopyMessage('프롬프트가 클립보드에 복사되었습니다.');
    } catch {
      setCopyMessage('복사에 실패했습니다. 프롬프트를 직접 선택해 주세요.');
    }
  };

  return (
    <main>
      <section className="content-section" aria-labelledby="detail-title">
        <div className="prompt-modal detail-page-panel" role="dialog" aria-modal="false" aria-labelledby="detail-title">
          <motion.button
            className="modal-close"
            type="button"
            onClick={() => navigate('/prompts')}
            aria-label="프롬프트 상세 닫기"
            {...buttonMotion}
          >
            Close
          </motion.button>
          <MediaPreview
            prompt={prompt}
            failedVideoIds={failedVideoIds}
            setFailedVideoIds={setFailedVideoIds}
            className="modal-preview"
          />

          <div className="modal-content">
            <div className="modal-topline">
              <span>{prompt.platform}</span>
              <span>{prompt.category}</span>
            </div>
            <h1 id="detail-title">{prompt.title}</h1>
            <div className="modal-meta">
              <span>난이도: {prompt.difficulty}</span>
              <strong>{getLikeCount(prompt).toLocaleString()} likes</strong>
            </div>
            <p className="modal-prompt">{prompt.prompt}</p>
            <div className="tag-list modal-tags" aria-label={`${prompt.title} 태그`}>
              {prompt.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="modal-actions">
              <motion.button className="primary-button" type="button" onClick={copyPrompt} {...buttonMotion}>
                프롬프트 복사
              </motion.button>
              <motion.button
                className={`like-button modal-like-button ${likedPromptIds.includes(prompt.id) ? 'liked' : ''}`}
                type="button"
                disabled={isUpdatingLike}
                onClick={() => toggleLike(prompt.id)}
                aria-pressed={likedPromptIds.includes(prompt.id)}
                {...buttonMotion}
              >
                <span aria-hidden="true">♥</span>
                {isUpdatingLike ? '저장 중' : likedPromptIds.includes(prompt.id) ? '좋아요 취소' : '좋아요'}
              </motion.button>
              {copyMessage && <span className="copy-message">{copyMessage}</span>}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main>
      <section className="content-section">
        <div className="empty-state">
          <strong>페이지를 찾을 수 없습니다.</strong>
          <span>주소를 확인하거나 홈으로 돌아가 주세요.</span>
          <Link className="primary-button" to="/">홈으로 이동</Link>
        </div>
      </section>
    </main>
  );
}
function AppRoutes() {
  const [prompts, setPrompts] = useState(videoPrompts);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(categoryFilters[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [failedVideoIds, setFailedVideoIds] = useState([]);
  const [likedPromptIds, setLikedPromptIds] = useState([]);
  const [likeUpdatingIds, setLikeUpdatingIds] = useState([]);
  const [adminForm, setAdminForm] = useState(initialAdminForm);
  const [adminErrors, setAdminErrors] = useState({});
  const [adminMessage, setAdminMessage] = useState('');
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(Boolean(supabase));
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [databaseMessage, setDatabaseMessage] = useState(supabaseSetupMessage);
  const [databaseError, setDatabaseError] = useState('');
  const [session, setSession] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(supabase));
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const getLikeCount = (prompt) => prompt.likes ?? 0;
  const topPrompts = [...prompts]
    .sort((firstPrompt, secondPrompt) => getLikeCount(secondPrompt) - getLikeCount(firstPrompt))
    .slice(0, 5);

  useEffect(() => {
    if (!supabase) {
      setDatabaseMessage(supabaseSetupMessage);
      setIsLoadingPrompts(false);
      return;
    }

    let shouldIgnore = false;

    const loadPrompts = async () => {
      setIsLoadingPrompts(true);
      setDatabaseError('');
      setDatabaseMessage('Supabase에서 프롬프트 데이터를 불러오는 중입니다.');

      const { data, error } = await supabase
        .from('video_prompts')
        .select(videoPromptColumns)
        .order('created_at', { ascending: false });

      if (shouldIgnore) {
        return;
      }

      if (error) {
        setDatabaseError(`Supabase 연결 오류: ${error.message}. 로컬 샘플 데이터를 표시합니다.`);
        setDatabaseMessage('');
        setIsLoadingPrompts(false);
        return;
      }

      setPrompts(data.length > 0 ? data.map(mapVideoPromptRow) : videoPrompts);
      setDatabaseMessage('');
      setIsLoadingPrompts(false);
    };

    loadPrompts();

    return () => {
      shouldIgnore = true;
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    let shouldIgnore = false;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (shouldIgnore) {
        return;
      }

      if (error) {
        setAuthError(`로그인 상태 확인 오류: ${error.message}`);
      }

      setSession(data.session);
      setIsAuthLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAuthLoading(false);
      if (nextSession) {
        setAuthError('');
      }
    });

    return () => {
      shouldIgnore = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginInputChange = (event) => {
    const { name, value } = event.target;

    setLoginForm((currentForm) => ({ ...currentForm, [name]: value }));
    setAuthError('');
    setAuthMessage('');
  };

  const handleAuthSubmit = async (event, mode = 'login') => {
    event.preventDefault();

    if (!supabase) {
      setAuthError(supabaseSetupMessage || 'Supabase 설정이 필요합니다.');
      return;
    }

    if (!loginForm.email.trim() || (mode !== 'reset' && !loginForm.password)) {
      setAuthError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (mode === 'reset') {
      setIsSubmittingAuth(true);
      setAuthError('');
      setAuthMessage('');

      const { error } = await supabase.auth.resetPasswordForEmail(loginForm.email.trim(), {
        redirectTo: window.location.origin,
      });

      setIsSubmittingAuth(false);

      if (error) {
        setAuthError(`비밀번호 재설정 메일 전송 실패: ${error.message}`);
        return;
      }

      setLoginForm(initialLoginForm);
      setAuthMessage('비밀번호 재설정 메일을 보냈습니다. 메일함을 확인해주세요.');
      return;
    }

    if (mode === 'signup' && loginForm.password !== loginForm.confirmPassword) {
      setAuthError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    if (mode === 'signup' && loginForm.password.length < 6) {
      setAuthError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsSubmittingAuth(true);
    setAuthError('');
    setAuthMessage('');

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      setIsSubmittingAuth(false);

      if (error) {
        setAuthError(getFriendlyAuthError(error, 'signup'));
        return;
      }

      setLoginForm(initialLoginForm);
      if (data.session) {
        setAuthMessage('회원가입이 완료되었습니다. 관리자 페이지로 이동합니다.');
      } else {
        setAuthMessage('회원가입이 완료되었습니다. 이메일 확인이 필요한 경우 메일함을 확인해주세요.');
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email.trim(),
      password: loginForm.password,
    });

    setIsSubmittingAuth(false);

    if (error) {
      setAuthError(getFriendlyAuthError(error, 'login'));
      return;
    }

    setLoginForm(initialLoginForm);
  };

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    setIsSigningOut(true);
    setAuthError('');
    setAuthMessage('');

    const { error } = await supabase.auth.signOut();

    setIsSigningOut(false);

    if (error) {
      setAuthError(`로그아웃 오류: ${error.message}`);
    }
  };

  const toggleLike = async (promptId) => {
    if (likeUpdatingIds.includes(promptId)) {
      return;
    }

    const targetPrompt = prompts.find((prompt) => prompt.id === promptId);
    if (!targetPrompt) {
      return;
    }

    const hasLiked = likedPromptIds.includes(promptId);
    const currentLikes = targetPrompt.likes ?? 0;
    const nextLikes = Math.max(currentLikes + (hasLiked ? -1 : 1), 0);

    setDatabaseError('');
    setLikeUpdatingIds((currentIds) => [...currentIds, promptId]);
    setPrompts((currentPrompts) =>
      currentPrompts.map((prompt) =>
        prompt.id === promptId ? { ...prompt, likes: nextLikes } : prompt,
      ),
    );
    setLikedPromptIds((currentIds) =>
      hasLiked
        ? currentIds.filter((currentId) => currentId !== promptId)
        : [...currentIds, promptId],
    );

    if (!supabase || !session) {
      setLikeUpdatingIds((currentIds) => currentIds.filter((currentId) => currentId !== promptId));
      return;
    }

    const { data, error } = await supabase
      .from('video_prompts')
      .update({ likes: nextLikes })
      .eq('id', promptId)
      .select(videoPromptColumns)
      .single();

    setLikeUpdatingIds((currentIds) => currentIds.filter((currentId) => currentId !== promptId));

    if (error) {
      setPrompts((currentPrompts) =>
        currentPrompts.map((prompt) =>
          prompt.id === promptId ? { ...prompt, likes: currentLikes } : prompt,
        ),
      );
      setLikedPromptIds((currentIds) =>
        hasLiked
          ? [...currentIds, promptId]
          : currentIds.filter((currentId) => currentId !== promptId),
      );
      setDatabaseError(`좋아요 저장 오류: ${error.message}`);
      return;
    }

    setPrompts((currentPrompts) =>
      currentPrompts.map((prompt) => (prompt.id === promptId ? mapVideoPromptRow(data) : prompt)),
    );
  };

  const handleAdminInputChange = (event) => {
    const { name, value } = event.target;

    setAdminForm((currentForm) => ({ ...currentForm, [name]: value }));
    setAdminErrors((currentErrors) => ({ ...currentErrors, [name]: '' }));
    setAdminMessage('');
  };

  const validateAdminForm = () => {
    const errors = {};
    ['title', 'platform', 'category', 'prompt', 'thumbnailUrl', 'difficulty', 'tags'].forEach((field) => {
      if (!adminForm[field].trim()) {
        errors[field] = '필수 입력 항목입니다.';
      }
    });

    return errors;
  };

  const handleAdminSubmit = async (event) => {
    event.preventDefault();

    if (!session) {
      setAdminMessage('로그인한 관리자만 프롬프트를 등록하거나 수정할 수 있습니다.');
      return;
    }

    const errors = validateAdminForm();
    if (Object.keys(errors).length > 0) {
      setAdminErrors(errors);
      setAdminMessage('');
      return;
    }

    const promptPayload = {
      title: adminForm.title.trim(),
      platform: adminForm.platform,
      category: adminForm.category,
      prompt: adminForm.prompt.trim(),
      thumbnailUrl: adminForm.thumbnailUrl.trim(),
      videoUrl: adminForm.videoUrl.trim(),
      difficulty: adminForm.difficulty,
      tags: adminForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    setIsSavingPrompt(true);
    setDatabaseError('');

    if (supabase) {
      if (editingPromptId) {
        const currentPrompt = prompts.find((prompt) => prompt.id === editingPromptId);
        const updatedPrompt = {
          ...currentPrompt,
          ...promptPayload,
          likes: currentPrompt?.likes ?? 0,
          createdAt: currentPrompt?.createdAt ?? new Date().toISOString().slice(0, 10),
        };
        const { data, error } = await supabase
          .from('video_prompts')
          .update(mapVideoPromptToRow(updatedPrompt))
          .eq('id', editingPromptId)
          .select(videoPromptColumns)
          .single();

        if (error) {
          setAdminMessage(`Supabase 수정 오류: ${error.message}`);
          setDatabaseError(`Supabase 수정 오류: ${error.message}`);
          setIsSavingPrompt(false);
          return;
        }

        setPrompts((currentPrompts) =>
          currentPrompts.map((prompt) =>
            prompt.id === editingPromptId ? mapVideoPromptRow(data) : prompt,
          ),
        );
        setAdminMessage('영상 프롬프트가 수정되었습니다.');
      } else {
        const newPrompt = {
          ...promptPayload,
          likes: 0,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        const { data, error } = await supabase
          .from('video_prompts')
          .insert(mapVideoPromptToRow(newPrompt))
          .select(videoPromptColumns)
          .single();

        if (error) {
          setAdminMessage(`Supabase 등록 오류: ${error.message}`);
          setDatabaseError(`Supabase 등록 오류: ${error.message}`);
          setIsSavingPrompt(false);
          return;
        }

        setPrompts((currentPrompts) => [mapVideoPromptRow(data), ...currentPrompts]);
        setAdminMessage('새 영상 프롬프트가 등록되었습니다.');
      }

      setAdminForm(initialAdminForm);
      setAdminErrors({});
      setEditingPromptId(null);
      setIsSavingPrompt(false);
      return;
    }

    if (editingPromptId) {
      setPrompts((currentPrompts) =>
        currentPrompts.map((prompt) =>
          prompt.id === editingPromptId ? { ...prompt, ...promptPayload } : prompt,
        ),
      );
      setAdminMessage('영상 프롬프트가 수정되었습니다.');
    } else {
      const nextId = Math.max(...prompts.map((prompt) => prompt.id), 0) + 1;
      setPrompts((currentPrompts) => [
        {
          id: nextId,
          ...promptPayload,
          likes: 0,
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...currentPrompts,
      ]);
      setAdminMessage('새 영상 프롬프트가 등록되었습니다.');
    }

    setAdminForm(initialAdminForm);
    setAdminErrors({});
    setEditingPromptId(null);
    setIsSavingPrompt(false);
  };

  const startEditPrompt = (prompt) => {
    if (!session) {
      setAdminMessage('로그인한 관리자만 프롬프트를 수정할 수 있습니다.');
      return;
    }

    setEditingPromptId(prompt.id);
    setAdminForm({
      title: prompt.title,
      platform: prompt.platform,
      category: prompt.category,
      prompt: prompt.prompt,
      thumbnailUrl: prompt.thumbnailUrl,
      videoUrl: prompt.videoUrl,
      difficulty: prompt.difficulty,
      tags: prompt.tags.join(', '),
    });
    setAdminErrors({});
    setAdminMessage('수정할 프롬프트를 불러왔습니다.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditPrompt = () => {
    setEditingPromptId(null);
    setAdminForm(initialAdminForm);
    setAdminErrors({});
    setAdminMessage('');
  };

  const deletePrompt = async (promptId) => {
    if (!session) {
      setAdminMessage('로그인한 관리자만 프롬프트를 삭제할 수 있습니다.');
      return;
    }

    if (!window.confirm('이 프롬프트를 삭제할까요?')) {
      return;
    }

    setIsSavingPrompt(true);
    setDatabaseError('');

    if (supabase) {
      const { error } = await supabase.from('video_prompts').delete().eq('id', promptId);

      if (error) {
        setAdminMessage(`Supabase 삭제 오류: ${error.message}`);
        setDatabaseError(`Supabase 삭제 오류: ${error.message}`);
        setIsSavingPrompt(false);
        return;
      }
    }

    setPrompts((currentPrompts) => currentPrompts.filter((prompt) => prompt.id !== promptId));
    setLikedPromptIds((currentIds) => currentIds.filter((currentId) => currentId !== promptId));
    setFailedVideoIds((currentIds) => currentIds.filter((currentId) => currentId !== promptId));
    if (editingPromptId === promptId) {
      cancelEditPrompt();
    }
    setAdminMessage('영상 프롬프트가 삭제되었습니다.');
    setIsSavingPrompt(false);
  };

  return (
    <motion.div
      className="app"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <Header session={session} onSignOut={handleSignOut} isSigningOut={isSigningOut} />
      {isLoadingPrompts && (
        <div className="database-notice" role="status">
          프롬프트 목록을 불러오는 중입니다.
        </div>
      )}
      {databaseError && (
        <div className="database-notice database-notice-error" role="alert">
          {databaseError}
        </div>
      )}
      {databaseMessage && (
        <div className="database-notice" role="status">
          {databaseMessage}
        </div>
      )}
      <Routes>
        <Route path="/" element={<HomePage prompts={prompts} />} />
        <Route
          path="/prompts"
          element={
            <PromptsPage
              prompts={prompts}
              selectedPlatform={selectedPlatform}
              setSelectedPlatform={setSelectedPlatform}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isLoadingPrompts={isLoadingPrompts}
              likedPromptIds={likedPromptIds}
              likeUpdatingIds={likeUpdatingIds}
              getLikeCount={getLikeCount}
              toggleLike={toggleLike}
              failedVideoIds={failedVideoIds}
              setFailedVideoIds={setFailedVideoIds}
            />
          }
        />
        <Route path="/categories" element={<CategoriesPage prompts={prompts} />} />
        <Route path="/ranking" element={<RankingPage topPrompts={topPrompts} getLikeCount={getLikeCount} />} />
        <Route
          path="/login"
          element={
            <LoginPage
              mode="login"
              session={session}
              isAuthLoading={isAuthLoading}
              loginForm={loginForm}
              authError={authError}
              authMessage={authMessage}
              isSubmittingAuth={isSubmittingAuth}
              handleLoginInputChange={handleLoginInputChange}
              handleAuthSubmit={handleAuthSubmit}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <LoginPage
              mode="signup"
              session={session}
              isAuthLoading={isAuthLoading}
              loginForm={loginForm}
              authError={authError}
              authMessage={authMessage}
              isSubmittingAuth={isSubmittingAuth}
              handleLoginInputChange={handleLoginInputChange}
              handleAuthSubmit={handleAuthSubmit}
            />
          }
        />
        <Route
          path="/reset-password"
          element={
            <LoginPage
              mode="reset"
              session={session}
              isAuthLoading={isAuthLoading}
              loginForm={loginForm}
              authError={authError}
              authMessage={authMessage}
              isSubmittingAuth={isSubmittingAuth}
              handleLoginInputChange={handleLoginInputChange}
              handleAuthSubmit={handleAuthSubmit}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute session={session} isAuthLoading={isAuthLoading}>
              <AdminPage
                prompts={prompts}
                adminForm={adminForm}
                adminErrors={adminErrors}
                adminMessage={adminMessage}
                editingPromptId={editingPromptId}
                isSavingPrompt={isSavingPrompt}
                handleAdminInputChange={handleAdminInputChange}
                handleAdminSubmit={handleAdminSubmit}
                startEditPrompt={startEditPrompt}
                cancelEditPrompt={cancelEditPrompt}
                deletePrompt={deletePrompt}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prompts/:id"
          element={
            <PromptDetailPage
              prompts={prompts}
              likedPromptIds={likedPromptIds}
              likeUpdatingIds={likeUpdatingIds}
              getLikeCount={getLikeCount}
              toggleLike={toggleLike}
              failedVideoIds={failedVideoIds}
              setFailedVideoIds={setFailedVideoIds}
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <footer className="site-footer" id="contact">
        <span>Designed for AI video creators</span>
        <a href="mailto:studio@example.com">studio@example.com</a>
      </footer>
    </motion.div>
  );
}

function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

export default App;





