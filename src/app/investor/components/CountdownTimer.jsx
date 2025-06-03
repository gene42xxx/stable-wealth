import React, { useState, useEffect, useRef } from 'react';
import { Clock, Loader2 } from 'lucide-react'; // Assuming you're using lucide-react

// Helper function to format milliseconds into a readable duration string
const formatDuration = (ms) => {
    // Add explicit check for invalid input
    if (typeof ms !== 'number' || isNaN(ms) || ms < 0) {
        console.warn('[CountdownTimer] formatDuration received invalid input:', ms);
        return '00:00:00'; // Return default or indicate error
    }
    if (ms === 0) {
        return '00:00:00'; // Handle zero explicitly
    }

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const seconds = totalSeconds % 60;
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600); // Hours within the current day

    const paddedSeconds = String(seconds).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedHours = String(hours).padStart(2, '0');
    const paddedDays = String(days).padStart(2, '0');

    if (days > 0) {
        // Example: "2 days 05:15:30"
        return (
            <div className="flex items-center space-x-2 font-mono text-sm">
                <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">{paddedDays}</span>
                    <span className="text-xs text-gray-400">Day{days > 1 ? 's' : ''}</span>
                </div>
                <span className="text-gray-500">:</span>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">{paddedHours}</span>
                    <span className="text-xs text-gray-400">Hours</span>
                </div>
                <span className="text-gray-500">:</span>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">{paddedMinutes}</span>
                    <span className="text-xs text-gray-400">Minutes</span>
                </div>
                <span className="text-gray-500">:</span>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">{paddedSeconds}</span>
                    <span className="text-xs text-gray-400">Seconds</span>
                </div>
            </div>
        );
    } else {
        // Example: "12:34:56"
        return (
            <div className="flex items-center space-x-2 font-mono text-sm">
                <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">{paddedHours}</span>
                    <span className="text-xs text-gray-400">Hours</span>
                </div>
                <span className="text-gray-500">:</span>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">{paddedMinutes}</span>
                    <span className="text-xs text-gray-400">Minutes</span>
                </div>
                <span className="text-gray-500">:</span>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">{paddedSeconds}</span>
                    <span className="text-xs text-gray-400">Seconds</span>
                </div>
            </div>
        );
    }
};


const CountdownTimer = ({ timeToNextThreshold, thresholdLoading }) => {
    // State to hold the *current* remaining time in milliseconds
    // Initialize based on the prop, but allow null if prop is invalid/null
    const [remainingTime, setRemainingTime] = useState(
        timeToNextThreshold !== null && typeof timeToNextThreshold === 'number' && timeToNextThreshold > 0
            ? timeToNextThreshold
            : null
    );

    // Use a ref to keep track of the interval ID
    const intervalRef = useRef(null);

    // Effect to manage the countdown interval
    useEffect(() => {
        // Function to clear any existing interval
        const clearExistingInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        // Clear previous interval before setting up a new one or stopping
        clearExistingInterval();

        // Determine the initial time based on the prop, ensuring it's a positive number
        const initialTimeMs = timeToNextThreshold !== null && typeof timeToNextThreshold === 'number' && timeToNextThreshold > 0
            ? timeToNextThreshold
            : null;

        // Set the state based on the calculated initial time
        setRemainingTime(initialTimeMs);

        // Only start a new interval if not loading and we have a valid positive time
        if (!thresholdLoading && initialTimeMs !== null && initialTimeMs > 0) {
            intervalRef.current = setInterval(() => {
                setRemainingTime((prevTime) => {
                    // If previous time is null or less than/equal to 1 second, stop.
                    if (prevTime === null || prevTime <= 1000) {
                        clearExistingInterval(); // Clear the interval
                        return 0; // Set final state to 0
                    }
                    // Otherwise, decrement by 1 second (1000 ms)
                    return prevTime - 1000;
                });
            }, 1000);
        }

        // Cleanup function: This runs when the component unmounts or dependencies change
        return () => {
            clearExistingInterval(); // Ensure interval is cleared on cleanup
        };
    }, [timeToNextThreshold, thresholdLoading]); // Dependencies: Re-run effect if these change

    // --- Render Logic ---
    const renderCountdownContent = () => {
        if (thresholdLoading) {
            return (
                <div className="flex items-center">
                    <Loader2 size={16} className="animate-spin mr-2 text-gray-400" />
                    <span className="italic text-gray-500">Loading countdown...</span>
                </div>
            );
        }

        // Case 1: Actively counting down
        if (remainingTime !== null && remainingTime > 0) {
            return (
                <>
                    <span className="text-xl font-bold text-cyan-500 tracking-wide">
                        {/* Use the helper function to format remaining time */}
                        {formatDuration(remainingTime)}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                        Time left to meet the current week's deposit requirement to ensure continuous bot operation.
                    </p>
                </>
            );
        }

        // Case 2: Countdown finished (remainingTime is 0, and it started from a valid prop)
        if (remainingTime === 0 && timeToNextThreshold !== null && typeof timeToNextThreshold === 'number') {
            return (
                <>
                    <div className="text-xl font-bold text-red-400">
                        Deposit required now!
                    </div>
                    <p className="text-xs text-red-500 mt-2">
                        Deposit needed immediately to avoid bot interruption.
                    </p>
                </>
            );
        }

        // Case 3: Default - No countdown applicable (inactive, met, invalid prop initially)
        return (
            <div className="text-gray-500">
                N/A (Bot inactive or requirement met)
            </div>
        );
    };

    return (
        <div className="p-4 bg-gray-800/60 rounded-3xl border border-gray-700/50">
            <div className="flex items-center mb-2">
                <Clock size={18} className="mr-2 text-cyan-500" />
                <span className="text-gray-300 font-medium">Time Until Next Deposit </span>
            </div>
            {renderCountdownContent()}
        </div>
    );
};

export default CountdownTimer; // Make sure to export if it's in its own file
