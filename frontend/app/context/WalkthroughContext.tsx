import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

export type WalkthroughStep =
    | "none"
    | "welcome"
    | "go_to_counters"
    | "pick_counter"
    | "start_learning"
    | "answer_exercise"
    | "go_to_profile"
    | "completed";

interface WalkthroughContextType {
    currentStep: WalkthroughStep;
    setStep: (step: WalkthroughStep) => void;
    nextStep: () => void;
    complete: () => void;
    reset: () => void;
}

const COOKIE_NAME = "nihongo_walkthrough_step";

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
    const [currentStep, setCurrentStep] = useState<WalkthroughStep>("none");

    useEffect(() => {
        const savedStep = Cookies.get(COOKIE_NAME) as WalkthroughStep;
        if (savedStep && savedStep !== "completed") {
            setCurrentStep(savedStep);
        } else if (!savedStep) {
            setCurrentStep("welcome");
        } else {
            setCurrentStep("completed");
        }
    }, []);

    const setStep = (step: WalkthroughStep) => {
        setCurrentStep(step);
        Cookies.set(COOKIE_NAME, step, { expires: 365 });
    };

    const nextStep = () => {
        const steps: WalkthroughStep[] = [
            "welcome",
            "go_to_counters",
            "pick_counter",
            "start_learning",
            "answer_exercise",
            "go_to_profile",
            "completed"
        ];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex !== -1 && currentIndex < steps.length - 1) {
            setStep(steps[currentIndex + 1]);
        }
    };

    const complete = () => setStep("completed");
    const reset = () => setStep("welcome");

    return (
        <WalkthroughContext.Provider value={{ currentStep, setStep, nextStep, complete, reset }}>
            {children}
        </WalkthroughContext.Provider>
    );
}

export function useWalkthrough() {
    const context = useContext(WalkthroughContext);
    if (context === undefined) {
        throw new Error("useWalkthrough must be used within a WalkthroughProvider");
    }
    return context;
}
