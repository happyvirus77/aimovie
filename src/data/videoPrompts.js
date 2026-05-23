const createThumbnail = (from, via, to, label) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="48%" stop-color="${via}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="960" height="540" fill="url(#bg)" />
      <g opacity="0.26">
        <path d="M0 400 H960 M0 320 H960 M0 240 H960 M0 160 H960" stroke="#ffffff" />
        <path d="M120 0 V540 M280 0 V540 M440 0 V540 M600 0 V540 M760 0 V540" stroke="#ffffff" />
      </g>
      <circle cx="720" cy="155" r="92" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.68" filter="url(#glow)" />
      <path d="M110 390 L330 235 L500 310 L850 120" fill="none" stroke="#ffffff" stroke-width="7" opacity="0.72" filter="url(#glow)" />
      <text x="54" y="92" fill="#ffffff" font-family="Arial, sans-serif" font-size="42" font-weight="800">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const normalizeDate = (value) => (value ? String(value).slice(0, 10) : '');

export const mapVideoPromptRow = (row) => ({
  id: row.id,
  title: row.title ?? '',
  platform: row.platform ?? '',
  category: row.category ?? '',
  prompt: row.prompt ?? '',
  thumbnailUrl: row.thumbnail_url ?? row.thumbnailUrl ?? '',
  videoUrl: row.video_url ?? row.videoUrl ?? '',
  difficulty: row.difficulty ?? '',
  tags: Array.isArray(row.tags) ? row.tags : [],
  likes: Number(row.likes ?? 0),
  createdAt: normalizeDate(row.created_at ?? row.createdAt),
});

export const mapVideoPromptToRow = (prompt) => ({
  title: prompt.title,
  platform: prompt.platform,
  category: prompt.category,
  prompt: prompt.prompt,
  thumbnail_url: prompt.thumbnailUrl,
  video_url: prompt.videoUrl,
  difficulty: prompt.difficulty,
  tags: prompt.tags,
  likes: prompt.likes ?? 0,
  created_at: prompt.createdAt,
});

export const videoPromptRows = [
  {
    id: 1,
    title: 'Neon Rain Chase',
    platform: 'Runway',
    category: 'Film',
    prompt:
      'A courier runs through a neon-lit alley in heavy rain, reflective hologram signs, handheld camera, fast cuts, cyberpunk action sequence.',
    thumbnail_url: createThumbnail('#06111f', '#0ef3ff', '#ff35d1', 'NEON CHASE'),
    video_url: 'https://example.com/videos/neon-rain-chase',
    difficulty: 'Advanced',
    tags: ['Neon', 'Action', 'Rain'],
    likes: 284,
    created_at: '2026-05-12',
  },
  {
    id: 2,
    title: 'Luxury Perfume Signal',
    platform: 'Midjourney',
    category: 'Ad',
    prompt:
      'A crystal perfume bottle on black silk, slow macro push-in, premium commercial lighting, soft reflections, elegant product reveal.',
    thumbnail_url: createThumbnail('#120616', '#ff3cec', '#ffd166', 'AD SIGNAL'),
    video_url: 'https://example.com/videos/luxury-perfume-signal',
    difficulty: 'Beginner',
    tags: ['Product', 'Luxury', 'Macro'],
    likes: 326,
    created_at: '2026-05-10',
  },
  {
    id: 3,
    title: 'Android Memory Room',
    platform: 'Sora',
    category: 'Film',
    prompt:
      'An android studies family memories inside a dark archive room, gentle rim light, emotional sci-fi drama tone, slow cinematic camera.',
    thumbnail_url: createThumbnail('#13071f', '#7137ff', '#ff6ad5', 'MEMORY ROOM'),
    video_url: 'https://example.com/videos/android-memory-room',
    difficulty: 'Intermediate',
    tags: ['Android', 'Memory', 'Drama'],
    likes: 197,
    created_at: '2026-05-08',
  },
  {
    id: 4,
    title: 'K-Pop Zero Gravity',
    platform: 'Runway',
    category: 'Music Video',
    prompt:
      'A synthwave artist dances in a zero-gravity studio, flashing speaker walls, rotating camera moves, bold color lighting synced to the beat.',
    thumbnail_url: createThumbnail('#050610', '#602cff', '#2ff8ff', 'ZERO-G MV'),
    video_url: 'https://example.com/videos/kpop-zero-gravity',
    difficulty: 'Advanced',
    tags: ['Music', 'Synthwave', 'Dance'],
    likes: 441,
    created_at: '2026-05-07',
  },
  {
    id: 5,
    title: '15 Second Street Food Loop',
    platform: 'Sora',
    category: 'Shorts',
    prompt:
      'A rainy night street food stall, steam rising from a hot griddle, quick close-up cuts, seamless final frame for a vertical shorts loop.',
    thumbnail_url: createThumbnail('#071217', '#23ffb4', '#ff3cec', 'SHORT LOOP'),
    video_url: 'https://example.com/videos/street-food-loop',
    difficulty: 'Beginner',
    tags: ['Shorts', 'Food', 'Loop'],
    likes: 512,
    created_at: '2026-05-05',
  },
  {
    id: 6,
    title: 'Chrome Brand Manifesto',
    platform: 'Midjourney',
    category: 'Brand',
    prompt:
      'Chrome materials forming a brand symbol on a black stage, precise studio lighting, premium tech mood, polished launch manifesto shot.',
    thumbnail_url: createThumbnail('#080b14', '#dbe7ff', '#2ff8ff', 'BRAND CORE'),
    video_url: 'https://example.com/videos/chrome-brand-manifesto',
    difficulty: 'Intermediate',
    tags: ['Brand', 'Chrome', 'Tech'],
    likes: 268,
    created_at: '2026-05-03',
  },
  {
    id: 7,
    title: 'Data Sprite Animation',
    platform: 'Runway',
    category: 'Animation',
    prompt:
      'A small sprite character made of glowing data fragments glides through a web of light, transparent 3D animation style, soft tracking camera.',
    thumbnail_url: createThumbnail('#081025', '#c8ff54', '#2ff8ff', 'DATA ANIM'),
    video_url: 'https://example.com/videos/data-sprite-animation',
    difficulty: 'Intermediate',
    tags: ['Animation', 'Character', '3D'],
    likes: 389,
    created_at: '2026-04-30',
  },
  {
    id: 8,
    title: 'Quantum Market Night',
    platform: 'Sora',
    category: 'Ad',
    prompt:
      'A futuristic night market selling quantum devices, glowing UI panels, natural crowd movement, global campaign commercial tone.',
    thumbnail_url: createThumbnail('#160a12', '#ffd166', '#ff3cec', 'MARKET AD'),
    video_url: 'https://example.com/videos/quantum-market-night',
    difficulty: 'Expert',
    tags: ['Market', 'Campaign', 'World'],
    likes: 634,
    created_at: '2026-04-28',
  },
];

export const videoPrompts = videoPromptRows.map(mapVideoPromptRow);
