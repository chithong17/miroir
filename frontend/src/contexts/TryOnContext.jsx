import React, { createContext, useContext, useEffect, useState } from "react";
import { getTryOnTaskStatus } from "../api/tryonApi";

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
    let intervalId;

    const pollTaskStatus = async (taskId) => {
      try {
        const response = await getTryOnTaskStatus(taskId);
        if (response.status === "completed") {
          setCurrentTask((prev) => 
            prev?.id === taskId 
              ? { ...prev, status: "completed", resultUrl: response.resultUrl || "" }
              : prev
          );
        } else if (response.status === "failed" || response.success === false) {
          setCurrentTask((prev) => 
            prev?.id === taskId 
              ? { ...prev, status: "failed", errorMessage: response.errorMessage || "Try-on failed." }
              : prev
          );
        }
      } catch (error) {
        // Just log the error, don't fail immediately in case it's a network blip
        console.error("Failed to poll task status", error);
      }
    };

    if (currentTask && currentTask.status === "processing") {
      // Poll every 5 seconds
      intervalId = setInterval(() => {
        pollTaskStatus(currentTask.id);
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
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
