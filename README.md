# AI Video Prompt Portfolio

AI 영상 프롬프트를 카드형 포트폴리오로 정리하고, Supabase Auth로 관리자만 프롬프트를 등록, 수정, 삭제할 수 있는 React/Vite 사이트입니다.

## 주요 기능

- 프롬프트 목록, 검색, 플랫폼/카테고리 필터
- 프롬프트 상세 보기, 복사, 좋아요
- Supabase 이메일/비밀번호 로그인, 회원가입, 로그아웃
- 로그인하지 않은 사용자의 `/admin` 접근 제한
- 관리자 프롬프트 등록, 수정, 삭제
- 반응형 UI, 키보드 접근성, 이미지/영상 비율 유지

## 기술 스택

- React
- Vite
- React Router
- Framer Motion
- Supabase Auth / Database

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 Vite가 안내하는 로컬 URL을 엽니다.

## 환경 변수

`.env.example`을 참고해 프로젝트 루트에 `.env`를 만듭니다.

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Supabase 대시보드에서 다음 설정을 확인하세요.

- `Authentication > Providers > Email`
- `Enable email provider`: ON
- 회원가입을 허용하려면 `Allow new users to sign up`: ON
- 이메일 인증 없이 바로 로그인하려면 `Confirm email`: OFF

## Supabase 테이블

`src/data/videoPrompts.schema.sql`을 Supabase SQL Editor에서 실행하면 `video_prompts` 테이블과 RLS 정책을 만들 수 있습니다.

관리자 계정은 Supabase Auth에서 직접 만들거나, 앱의 `/signup` 화면에서 생성합니다.

## 빌드

```bash
npm run build
```

빌드 결과는 `dist/`에 생성됩니다.

```bash
npm run preview
```

로컬에서 프로덕션 빌드 결과를 확인할 수 있습니다.

## Vercel 배포

1. GitHub 저장소를 Vercel에 연결합니다.
2. Framework Preset은 `Vite`를 선택합니다.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables에 `.env.example`의 두 값을 등록합니다.
6. 배포 후 Supabase Auth URL 설정에 배포 도메인을 추가합니다.

Supabase에서 확인할 URL:

- `Authentication > URL Configuration > Site URL`
- `Authentication > URL Configuration > Redirect URLs`

## GitHub Pages 배포

GitHub Pages는 서브 경로에서 서비스되는 경우가 많으므로 Vite `base` 설정이 필요할 수 있습니다.

예를 들어 저장소 이름이 `ai-video-prompt-portfolio`라면 `vite.config.js`를 만들고 다음처럼 설정합니다.

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/ai-video-prompt-portfolio/',
});
```

그 후 GitHub Actions나 별도 배포 도구로 `dist/`를 Pages에 배포합니다. Supabase Auth Redirect URL에도 GitHub Pages 주소를 추가해야 로그인/회원가입 리다이렉트가 안정적으로 동작합니다.

## 배포 전 체크리스트

- `.env`가 커밋되지 않았는지 확인
- `npm run build` 성공 확인
- Supabase URL/anon key가 배포 환경 변수에 등록되었는지 확인
- Email provider와 회원가입 설정 확인
- `video_prompts` 테이블과 RLS 정책 적용 확인
