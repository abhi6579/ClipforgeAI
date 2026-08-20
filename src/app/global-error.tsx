"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#07060d",
          color: "#e9e7f5",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>ClipForge hit a fatal error</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "#94a3b8" }}>
          Reload the page to get back into your studio.
        </p>
        {error.digest && (
          <p style={{ marginTop: 12, fontSize: 11, color: "#475569" }}>ref: {error.digest}</p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: 24,
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(90deg,#7c3aed,#d946ef)",
            color: "#fff",
            padding: "10px 20px",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
