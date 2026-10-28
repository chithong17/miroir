import React, { createContext, useContext, useEffect, useState } from "react";
import { getTryOnTaskStatus } from "../api/tryonApi";
import { shouldRetryTryOnPoll, tryOnPollDelay } from "../lib/tryOnPolling.mjs";

const TryOnContext = createContext(null);

export const useTryOn = () => {
  const context = useContext(TryOnContext);
  if (!context) {
    throw new Error("useTryOn must be used within a TryOnProvider");
  }
  return context;
};

export const TryOnProvider = ({ children }) => {
  const [currentTask, setCurrentTask] = useState(() => {
    // Try to load from localStorage so it survives hard refreshes
    try {
      const saved = localStorage.getItem("miroir_tryon_task");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing tryon task from local storage", e);
    }
    return null;
  });

  // Save to local storage whenever it changes
  useEffect(() => {
    if (currentTask) {
      localStorage.setItem("miroir_tryon_task", JSON.stringify(currentTask));
    } else {
      localStorage.removeItem("miroir_tryon_task");
    }
  }, [currentTask]);

  // Polling effect
  useEffect(() => {
    let isCancelled = false;
    let timeoutId;
    let consecutiveFailures = 0;

    const pollTaskStatus = async (taskId) => {
      try {
        const response = await getTryOnTaskStatus(taskId);
        if (isCancelled) return;
        consecutiveFailures = 0;

        if (response.status === "completed") {
          setCurrentTask((prev) => 
            prev?.id === taskId 
              ? { ...prev, status: "completed", resultUrl: response.resultUrl || "" }
              : prev
          );
          return; // Stop polling
        } else if (response.status === "failed" || response.success === false) {
          setCurrentTask((prev) => 
            prev?.id === taskId 
              ? { ...prev, status: "failed", errorMessage: response.errorMessage || "Try-on failed." }
              : prev
          );
          return; // Stop polling
        }
      } catch (error) {
        if (isCancelled) return;
        // A failed status request does not mean image generation has failed.
        // Retry the same task; never create another billable generation here.
        if (shouldRetryTryOnPoll(error)) {
          consecutiveFailures += 1;
          setCurrentTask(prev => prev?.id === taskId
            ? { ...prev, connectionInterrupted: true }
            : prev);
          timeoutId = setTimeout(() => pollTaskStatus(taskId), tryOnPollDelay(consecutiveFailures - 1));
          return;
        }
        if (!isCancelled) {
          setCurrentTask((prev) => 
            prev?.id === taskId 
              ? { ...prev, status: "failed", errorMessage: error.response?.data?.message || "Lỗi kết nối khi lấy kết quả." }
              : prev
          );
        }
        return;
      }

      // If not completed or failed, and not cancelled, schedule next poll
      if (!isCancelled) {
        setCurrentTask(prev => prev?.id === taskId && prev.connectionInterrupted
          ? { ...prev, connectionInterrupted: false }
          : prev);
        timeoutId = setTimeout(() => pollTaskStatus(taskId), 5000);
      }
    };

    if (currentTask && currentTask.status === "processing") {
      // Start the polling loop (wait 15s before first check to match older code)
      timeoutId = setTimeout(() => pollTaskStatus(currentTask.id), 15000);
    }

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentTask?.id, currentTask?.status]);

  const startTask = (taskId, product = null, tryOnType = "custom") => {
    setCurrentTask({
      id: taskId,
      status: "processing", // processing, completed, failed
      resultUrl: "",
      errorMessage: "",
      product,
      tryOnType,
      createdAt: new Date().toISOString(),
    });
  };

  const clearTask = () => {
    setCurrentTask(null);
  };

  return (
    <TryOnContext.Provider value={{ currentTask, startTask, clearTask }}>
      {children}
    </TryOnContext.Provider>
  );
};
