"use client";

/**
 * Small decorative nature characters. They stay out of the way of map controls
 * and respect reduced-motion preferences through global CSS.
 */
export default function NatureAnimations() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 hidden px-5 sm:block" aria-hidden="true">
      <div className="flex items-end justify-between">
        <svg
          className="nature-character nature-character-walker"
          width="74"
          height="74"
          viewBox="0 0 74 74"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="37" cy="37" r="35" fill="#FFFDF6" fillOpacity="0.88" />
          <path d="M24 58C31 53 43 53 50 58" stroke="#1F4D3A" strokeWidth="3" strokeLinecap="round" />
          <circle cx="35" cy="18" r="7" fill="#D89B45" />
          <path d="M35 26L31 43L43 45L39 28L35 26Z" fill="#2F8F5B" />
          <path d="M30 34L21 39" stroke="#1F4D3A" strokeWidth="3" strokeLinecap="round" />
          <path d="M42 34L50 29" stroke="#1F4D3A" strokeWidth="3" strokeLinecap="round" />
          <path d="M33 44L28 57" stroke="#1F4D3A" strokeWidth="3" strokeLinecap="round" />
          <path d="M42 45L48 57" stroke="#1F4D3A" strokeWidth="3" strokeLinecap="round" />
          <path d="M45 27C51 29 54 35 52 42C48 42 45 39 43 35" fill="#8E7CC3" />
          <circle cx="50" cy="28" r="3" stroke="#145A3A" strokeWidth="2" />
          <circle cx="56" cy="28" r="3" stroke="#145A3A" strokeWidth="2" />
          <path d="M53 28H54" stroke="#145A3A" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <svg
          className="nature-character nature-character-monkey"
          width="74"
          height="74"
          viewBox="0 0 74 74"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="37" cy="37" r="35" fill="#FFFDF6" fillOpacity="0.88" />
          <path d="M50 44C59 43 61 31 52 30" stroke="#9A6B3F" strokeWidth="4" strokeLinecap="round" />
          <circle cx="24" cy="32" r="7" fill="#9A6B3F" />
          <circle cx="50" cy="32" r="7" fill="#9A6B3F" />
          <circle cx="37" cy="36" r="18" fill="#9A6B3F" />
          <ellipse cx="37" cy="42" rx="12" ry="10" fill="#D89B45" />
          <circle cx="31" cy="34" r="2" fill="#1F2D27" />
          <circle cx="43" cy="34" r="2" fill="#1F2D27" />
          <path d="M33 44C36 47 39 47 42 44" stroke="#1F2D27" strokeWidth="2" strokeLinecap="round" />
          <path d="M28 55C34 59 42 59 48 55" stroke="#1F4D3A" strokeWidth="3" strokeLinecap="round" />
          <path d="M18 23C20 18 26 15 31 16" stroke="#2F8F5B" strokeWidth="3" strokeLinecap="round" />
          <path d="M43 16C50 16 55 20 56 26" stroke="#2F8F5B" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
