import React, { useEffect, useState } from "react";
import { useTryOn } from "../../contexts/TryOnContext";

export function TryOnStatusBubble() {
  const { currentTask, clearTask } = useTryOn();
  const [isVisible, setIsVisible] = useState(false);

  // Determine if we should show the bubble based on the path
  const [isAppPath, setIsAppPath] = useState(false);

  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname;
      setIsAppPath(path.startsWith("/app") || path === "/try-on");
    };
    checkPath();

    // Listen to pushState if any custom routing happens (though it's a full page reload app mostly)
    window.addEventListener("popstate", checkPath);
    return () => window.removeEventListener("popstate", checkPath);
  }, []);

  useEffect(() => {
    if (currentTask && isAppPath) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentTask, isAppPath]);

  if (!isVisible || !currentTask) return null;

  const handleClick = () => {
    if (currentTask.status === "completed") {
      // Clear task and go to try-on result if clicked
      // Wait, we can navigate first, and the tryon page will read the completed state
      window.location.href = "/app/try-on";
    }
  };

  const handleClose = (e) => {
    e.stopPropagation();
    clearTask();
  };

  return (
    <div
      onClick={currentTask.status === "completed" ? handleClick : undefined}
      className={`fixed bottom-6 left-6 z-[100] flex cursor-pointer items-center gap-3 rounded-full border border-line bg-white/90 px-4 py-2.5 shadow-glass backdrop-blur-md transition-all hover:scale-105 sm:bottom-8 sm:left-8 ${
        currentTask.status === "completed"
          ? "border-mintSoft bg-mintDeep text-white shadow-glow"
          : currentTask.status === "failed"
          ? "border-red-200 bg-red-50"
          : ""
      }`}
    >
      {/* Icon or Spinner */}
      <div className="flex h-6 w-6 items-center justify-center">
        {currentTask.status === "processing" && (
          <div className="relative flex h-5 w-5 items-center justify-center">
            <span className="absolute inset-0 block rounded-full border-2 border-mint border-t-transparent animate-spin" />
            <span className="h-2 w-2 rounded-full bg-mintDeep animate-pulse" />
          </div>
        )}
        {currentTask.status === "completed" && (
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {currentTask.status === "failed" && (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col">
        <span
          className={`text-sm font-bold ${
            currentTask.status === "completed" ? "text-white" : "text-ink"
          }`}
        >
          {currentTask.status === "processing" && "Đang xử lý Try-On..."}
          {currentTask.status === "completed" && "Hoàn tất! Bấm để xem"}
          {currentTask.status === "failed" && "Tạo ảnh thất bại"}
        </span>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className={`ml-2 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
          currentTask.status === "completed"
            ? "hover:bg-white/20 text-white"
            : "hover:bg-panel text-muted"
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
