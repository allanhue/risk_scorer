import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#166534",
          borderRadius: 14,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          position: "relative",
          width: "100%",
        }}
      >
        <svg
          aria-label="Green Taxonomy Risk Scorer"
          height="44"
          viewBox="0 0 44 44"
          width="44"
        >
          <path
            d="M35 8C22 8 12 14 12 26c0 5 3 9 8 10 1-11 6-18 15-24Z"
            fill="#dcfce7"
          />
          <path
            d="M11 36c5-10 12-17 24-24"
            fill="none"
            stroke="#86efac"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="m26 31 4-4 4 2 5-8"
            fill="none"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
