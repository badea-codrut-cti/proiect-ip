import React, { useEffect, useState, useRef } from "react";
import { Button } from "~/components/ui/button";
import { useWalkthrough, type WalkthroughStep as StepType } from "~/context/WalkthroughContext";
import { useAuth } from "~/context/AuthContext";

interface WalkthroughStepProps {
    step: StepType;
    title: string;
    description: string;
    children: React.ReactElement;
    side?: "top" | "bottom" | "left" | "right";
    onNext?: () => void;
    hideNext?: boolean;
}

export function WalkthroughStep({
    step,
    title,
    description,
    children,
    side = "bottom",
    onNext,
    hideNext = false,
}: WalkthroughStepProps) {
    const { currentStep, nextStep, complete } = useWalkthrough();
    const { user } = useAuth();
    const [visible, setVisible] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const childRef = useRef<HTMLElement>(null);

    // Only show if we're on this step and user is logged in
    const shouldShow = user && currentStep === step;

    useEffect(() => {
        if (shouldShow) {
            const timer = setTimeout(() => setVisible(true), 500);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [shouldShow]);

    useEffect(() => {
        if (visible && childRef.current) {
            const rect = childRef.current.getBoundingClientRect();
            const style: React.CSSProperties = {
                position: "fixed",
                zIndex: 9999,
            };

            switch (side) {
                case "top":
                    style.left = rect.left + rect.width / 2 - 144; // 144 = half of w-72 (288px)
                    style.top = rect.top - 8;
                    style.transform = "translateY(-100%)";
                    break;
                case "bottom":
                    style.left = rect.left + rect.width / 2 - 144;
                    style.top = rect.bottom + 8;
                    break;
                case "left":
                    style.left = rect.left - 8;
                    style.top = rect.top + rect.height / 2;
                    style.transform = "translate(-100%, -50%)";
                    break;
                case "right":
                    style.left = rect.right + 8;
                    style.top = rect.top + rect.height / 2;
                    style.transform = "translateY(-50%)";
                    break;
            }

            setTooltipStyle(style);
        }
    }, [visible, side]);

    const handleNext = () => {
        setVisible(false);
        if (onNext) {
            onNext();
        } else {
            nextStep();
        }
    };

    const handleSkip = () => {
        setVisible(false);
        complete();
    };

    // Clone child to add ref
    const childWithRef = React.cloneElement(children, {
        ref: childRef,
    });

    return (
        <>
            {childWithRef}
            {visible && (
                <div
                    className="w-72 p-4 rounded-md border-2 border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in duration-200 dark:bg-slate-900 dark:border-slate-700"
                    style={tooltipStyle}
                >
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <h4 className="font-bold leading-none text-slate-900 dark:text-slate-50 normal-case tracking-normal">{title}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 normal-case font-normal tracking-normal">
                                {description}
                            </p>
                        </div>
                        {!hideNext && (
                            <div className="flex justify-between items-center pt-2">
                                <button
                                    onClick={handleSkip}
                                    className="text-[0.65rem] uppercase tracking-wider text-slate-400 hover:text-slate-600 transition"
                                >
                                    Skip tutorial
                                </button>
                                <Button size="sm" onClick={handleNext} className="h-8 text-xs px-3">
                                    {step === "go_to_profile" ? "Finish" : "Got it!"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
