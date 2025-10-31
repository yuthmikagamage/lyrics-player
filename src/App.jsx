import React, { useEffect, useRef, useState } from "react";
import "./App.css";

export default function LyricsPlayer() {
  const audioRef = useRef(null);
  const lineRefs = useRef([]);
  const [lyrics, setLyrics] = useState([]);
  const [currentLine, setCurrentLine] = useState(-1);
  const autoScrollRef = useRef(true);
  const scrollTimeoutRef = useRef(null);
  const lyricsContainerRef = useRef(null);

  useEffect(() => {
    fetch("./Ordinary.srt")
      .then((r) => r.text())
      .then((t) => parseSRT(t));
    return () => clearTimeout(scrollTimeoutRef.current);
  }, []);

  const parseSRT = (data) => {
    const blocks = data.replace(/\r/g, "").trim().split("\n\n");
    const parsed = blocks
      .map((b) => {
        const lines = b.split("\n").filter(Boolean);
        if (lines.length >= 2) {
          const time = lines[1].split(" --> ");
          if (!time || time.length < 2) return null;
          return {
            start: toSeconds(time[0].trim()),
            end: toSeconds(time[1].trim()),
            text: lines.slice(2).join(" ").trim(),
          };
        }
        return null;
      })
      .filter(Boolean);
    setLyrics(parsed);
  };

  const toSeconds = (t) => {
    const [hms, ms = "0"] = t.split(",");
    const parts = hms.split(":").map(Number);
    while (parts.length < 3) parts.unshift(0);
    return parts[0] * 3600 + parts[1] * 60 + parts[2] + Number(ms) / 1000;
  };

  const handleManualScroll = () => {
    autoScrollRef.current = false;
    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      autoScrollRef.current = true;
    }, 3000);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    let idx = lyrics.findIndex((l) => current >= l.start && current <= l.end);
    if (idx === -1) {
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (current >= lyrics[i].start) {
          idx = i;
          break;
        }
      }
    }

    if (idx !== currentLine) setCurrentLine(idx);

    if (idx !== -1 && autoScrollRef.current) {
      const el = lineRefs.current[idx];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handleClickLine = (time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    audioRef.current.play();
  };

  return (
    <div className="lp-root">
      <div className="lp-player">
        <audio
          ref={audioRef}
          src="./Ordinary.mp3"
          controls
          onTimeUpdate={handleTimeUpdate}
        />
      </div>

      <div
        className="lp-lyrics"
        ref={lyricsContainerRef}
        onScroll={handleManualScroll}
      >
        {lyrics.map((line, i) => (
          <div
            key={i}
            ref={(el) => (lineRefs.current[i] = el)}
            className={`lp-line ${i === currentLine ? "active" : ""}`}
            onClick={() => handleClickLine(line.start)}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}
