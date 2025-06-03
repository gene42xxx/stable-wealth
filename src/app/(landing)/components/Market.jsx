// ./components/ResponsiveMarketPerformance.jsx (COMPLETE CODE - V13 - No List Animations - Verified Full)
'use client';

// --- Imports ---
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';

// --- START: Global Formatting Functions (Full Code Below) ---
const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) return '$--.--';
    const options = {
        minimumFractionDigits: price < 1 ? 4 : 2, // More decimals for sub-dollar values
        maximumFractionDigits: price < 10 ? 4 : 2 // More decimals for values under $10
    };
    return `$${price.toLocaleString('en-US', options)}`;
};

const formatPercent = (change) => {
    if (typeof change !== 'number' || isNaN(change)) return '+0.00%';
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
};

const formatVolume = (volume) => {
    if (!volume || typeof volume !== 'number' || isNaN(volume)) return '$0';
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`; // Billions with 2 decimals
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`; // Millions with 1 decimal
    return `$${volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`; // No decimals for <1M
};

const getIconUrl = (symbol) => {
    if (!symbol || typeof symbol !== 'string') return '/placeholder-icon.svg'; // Provide a path to a fallback icon
    return `https://assets.coincap.io/assets/icons/${symbol.replace('USDT', '').toLowerCase()}@2x.png`;
};
// --- END: Global Formatting Functions ---


// --- START: Animation Variants Definition (Full Code Below) ---
// Note: listVariants/itemVariants are defined but NOT currently applied to the list items as per previous request
// Kept here in case you want to re-enable entry animations later by uncommenting variants props
const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeInOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};
// --- END: Animation Variants Definition ---


// --- START: Helper Component Definitions (Full Code Below) ---

const SimpleSparkline = memo(({ positive }) => {
    const pathData = positive ? "M0,15 Q15,5 30,10 T60,5" : "M0,5 Q15,15 30,10 T60,15";
    const color = positive ? "#5EEAD4" : "#F87171"; // Teal-400 / Red-400
    // Using static path - no animation
    return (
        <svg width="60" height="20" viewBox="0 0 60 20" className="inline-block" aria-hidden="true">
            <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
            />
        </svg>
    );
});
SimpleSparkline.displayName = 'SimpleSparkline';

const LoadingState = () => (
    <div className="flex flex-col justify-center items-center p-10 md:p-20 min-h-[300px] text-center bg-transparent rounded-b-2xl">
        <motion.div
            className="w-10 h-10 border-t-2 border-b-2 border-indigo-500 rounded-full mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
        ></motion.div>
        <p className="font-accent text-gray-400 text-sm">Connecting to live market data...</p>
    </div>
);

const ErrorState = memo(({ error, onRetry }) => (
    <div className="flex flex-col justify-center items-center p-10 md:p-20 min-h-[300px] text-center bg-red-900/10 border-t border-red-700/30 rounded-b-2xl">
        <AlertTriangle className="text-red-400 mb-4" size={36} />
        <p className="text-red-300 font-accent mb-6 max-w-md text-sm">{error || 'An unknown error occurred.'}</p>
        <motion.button
            onClick={onRetry}
            whileHover={{ scale: 1.03, boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)" }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all text-sm"
        >
            Retry Connection
        </motion.button>
    </div>
));
ErrorState.displayName = 'ErrorState';

const MobileMarketCardItem = memo(({ crypto, updated }) => {
    const isPositive = (crypto?.change ?? 0) >= 0;
    // Update flash (optional - controlled by 'updated' prop)
    const updateClass = updated ? 'bg-indigo-900/20' : 'bg-gray-900/40';
    return (
        // Using regular div - no item entry animation
        <div
            // layout prop removed as entry animation is gone
            // animate prop removed for flash
            className={`${updateClass} backdrop-blur-md border border-gray-700/50 rounded-xl p-4 mb-3 flex items-center space-x-3 overflow-hidden relative hover:bg-gray-800/40 transition-colors duration-150`}
        >
            <img src={getIconUrl(crypto.symbol)} alt={`${crypto.name || crypto.symbol} icon`} width={40} height={40} loading="lazy" className="w-10 h-10 rounded-full border-2 border-gray-700 flex-shrink-0" onError={(e) => { e.currentTarget.src = '/placeholder-icon.svg'; e.currentTarget.onerror = null; }} />
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2"> <span className="font-display font-semibold text-base text-gray-100 truncate">{crypto.name || 'N/A'}</span> <span className="font-accent text-xs text-gray-400 uppercase flex-shrink-0">{crypto.symbol?.replace('USDT', '')}</span> </div>
                <div className="font-accent text-sm text-gray-300 tabular-nums mt-0.5"> {formatPrice(crypto.price)} </div>
            </div>
            <div className="text-right flex-shrink-0 pl-2">
                <div className={`flex items-center justify-end font-accent text-sm font-medium tabular-nums ${isPositive ? 'text-teal-400' : 'text-red-400'}`}> {isPositive ? <TrendingUp size={14} className="mr-1 flex-shrink-0" /> : <TrendingDown size={14} className="mr-1 flex-shrink-0" />} {formatPercent(crypto.change)} </div>
            </div>
        </div>
    );
});
MobileMarketCardItem.displayName = 'MobileMarketCardItem';

const DesktopTableRow = memo(({ crypto, updated }) => {
    const isPositive = (crypto?.change ?? 0) >= 0;
    const updateClass = updated ? 'bg-indigo-900/20' : '';
    return (
        // Using regular tr - no item entry animation
        <tr className={`border-b border-gray-800 hover:bg-gray-800/30 transition-colors duration-150 ${updateClass}`} >
            <td className="p-4 flex items-center space-x-3">
                <img src={getIconUrl(crypto.symbol)} alt={`${crypto.name || crypto.symbol} icon`} width={32} height={32} loading="lazy" className="w-8 h-8 rounded-full border border-gray-700 flex-shrink-0" onError={(e) => { e.currentTarget.src = '/placeholder-icon.svg'; e.currentTarget.onerror = null; }} />
                <div> <div className="font-display font-semibold text-sm text-gray-100">{crypto.name || 'N/A'}</div> <div className="font-accent text-xs text-gray-500 uppercase">{crypto.symbol?.replace('USDT', '')}</div> </div>
            </td>
            <td className="p-4 text-right font-accent text-sm text-gray-100 tabular-nums"> {formatPrice(crypto.price)} </td>
            <td className="p-4 text-right"> <div className={`flex items-center justify-end font-accent text-sm font-medium tabular-nums ${isPositive ? 'text-teal-400' : 'text-red-400'}`}> {isPositive ? <TrendingUp size={16} className="mr-1.5 flex-shrink-0" /> : <TrendingDown size={16} className="mr-1.5 flex-shrink-0" />} {formatPercent(crypto.change)} </div> </td>
            <td className="p-4 text-right font-accent text-sm text-gray-300 tabular-nums"> {formatVolume(crypto.volume)} </td>
            <td className="p-4 text-right"> <SimpleSparkline positive={isPositive} /> </td>
        </tr>
    );
});
DesktopTableRow.displayName = 'DesktopTableRow';

const DesktopMarketTable = ({ data, updatedSymbols }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
                <thead>
                    <tr className="border-b border-gray-800">
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                        <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">24h Change</th>
                        <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Volume (24h)</th>
                        <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Trend (24h)</th>
                    </tr>
                </thead>
                {/* Use regular tbody - no list animation */}
                <tbody>
                    {data.map((crypto) => (<DesktopTableRow key={crypto.symbol} crypto={crypto} updated={updatedSymbols?.has(crypto.symbol)} />))}
                </tbody>
            </table>
        </div>
    );
};

const MobileCardList = ({ data, updatedSymbols }) => {
    return (
         <div className="p-3">
            {/* Use regular div - no list animation */}
            <div>
                {data.map(crypto => (<MobileMarketCardItem key={crypto.symbol} crypto={crypto} updated={updatedSymbols?.has(crypto.symbol)} />))}
            </div>
        </div>
    );
};
// --- END: Helper Component Definitions ---


// --- START: Main Component Definition (Full Code Below) ---
const ResponsiveMarketPerformance = () => {
    // --- State Declarations ---
    const [marketData, setMarketData] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [updatedSymbols, setUpdatedSymbols] = useState(new Set());
    const [isClient, setIsClient] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const retryTimeoutRef = useRef(null);
    const wsInstanceRef = useRef(null);

    const TOP_CRYPTOCURRENCIES = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'MATICUSDT', 'DOTUSDT', 'LINKUSDT'];

    // --- Effects ---
    useEffect(() => { setIsClient(true); }, []);

    useEffect(() => {
        if (!isClient) return;
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isClient]);

    // --- Callbacks (fetchMarketDataFallback, scheduleRetry, initializeMarketData, getFilteredMarketData) ---
    const fetchMarketDataFallback = useCallback(async () => {
        console.log("Using Fallback API Fetch...");
        if (marketData.length === 0) setIsLoading(true);
        let didFetchSuccessfully = false;
        try {
            const responses = await Promise.all(
                TOP_CRYPTOCURRENCIES.map(symbol =>
                    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
                        .then(res => res.ok ? res.json() : Promise.reject(new Error(`Status ${res.status}`)))
                        .catch(err => { console.warn(`Failed fetching ${symbol} via fallback:`, err.message); return null; })
                )
            );
            const successfulResponses = responses.filter(Boolean);
            if (successfulResponses.length === 0) throw new Error("All fallback fetches failed.");

            const processedData = successfulResponses.map(ticker => ({
                name: ticker.symbol.replace('USDT', ''), symbol: ticker.symbol,
                price: parseFloat(ticker.lastPrice), change: parseFloat(ticker.priceChangePercent),
                volume: parseFloat(ticker.quoteVolume), icon: getIconUrl(ticker.symbol), // Use global getIconUrl
            })).sort((a, b) => (b.volume || 0) - (a.volume || 0));

            setMarketData(processedData);
            if (error && error.toLowerCase().includes('connection')) { setError(null); } // Clear connection errors
            didFetchSuccessfully = true;
            console.log("Fallback data fetched successfully.");
        } catch (err) {
            console.log('Fallback API fetch error:', err);
            if (marketData.length === 0) setError('Unable to fetch market data. Please try again later.');
        } finally {
            // Ensure loading is turned off if fallback ran, regardless of socket state
             if (marketData.length === 0 || didFetchSuccessfully) {
                 setIsLoading(false);
             }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketData.length, error]); // Removed socket dependency

    const scheduleRetry = useCallback((delay = 15000) => {
        clearTimeout(retryTimeoutRef.current);
        // Do not schedule retry if component unmounted (ref is null) or connecting/connected
        if (!wsInstanceRef.current && (socket || isConnecting)) {
             console.log("Retry scheduling skipped: Already connected or connecting.");
             return;
        }
        console.log(`Scheduling WebSocket connection retry in ${delay / 1000} seconds...`);
        retryTimeoutRef.current = setTimeout(() => {
             if (!wsInstanceRef.current && !socket && !isConnecting) { // Double check state before retry
                 console.log("Executing scheduled retry...");
                 initializeMarketData();
             } else {
                 console.log("Retry skipped: State changed before execution.");
             }
        }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, isConnecting]); // initializeMarketData removed

    const initializeMarketData = useCallback(() => {
        if (!isClient || isConnecting || socket) { return; } // Prevent multiple attempts

        console.log("Attempting WebSocket connection...");
        setIsConnecting(true);
        if (marketData.length === 0) setIsLoading(true); // Show loading only if data is empty
        setError(null); // Clear previous error on new attempt
        clearTimeout(retryTimeoutRef.current); // Clear any pending retry

        const ws = new WebSocket('wss://stream.binance.com:9443/ws');
        wsInstanceRef.current = ws; // Store ref to current WS instance

        const connectTimeout = setTimeout(() => {
            if (ws && ws.readyState !== WebSocket.OPEN) {
                console.warn("WebSocket connection timeout.");
                ws.close(4999, "Connection timeout"); // Triggers onclose
            }
        }, 8000); // 8 seconds

        ws.onopen = () => {
            clearTimeout(connectTimeout);
            console.log("WebSocket Opened. Subscribing...");
            setSocket(ws); // Set state *only* on successful open
            setIsConnecting(false);
            setIsLoading(false); // Stop loading indicator
            setError(null); // Clear any previous errors
            const subscribeMessage = { method: "SUBSCRIBE", params: TOP_CRYPTOCURRENCIES.map(symbol => `${symbol.toLowerCase()}@ticker`), id: Date.now() };
            ws.send(JSON.stringify(subscribeMessage));
        };

        ws.onmessage = (event) => {
            let data; try { data = JSON.parse(event.data); } catch (e) { console.log("WS parse error:", e); return; }
            if (data?.e === '24hrTicker') {
                setMarketData(prevData => {
                    const dataMap = new Map(prevData.map(item => [item.symbol, item]));
                    const price = parseFloat(data.c); const change = parseFloat(data.P); const volume = parseFloat(data.q);
                    if (isNaN(price) || isNaN(change) || isNaN(volume)) { console.warn("Received invalid number data for:", data.s); return prevData; }
                    dataMap.set(data.s, { name: data.s.replace('USDT', ''), symbol: data.s, price, change, volume, icon: getIconUrl(data.s) });
                    return Array.from(dataMap.values()).sort((a, b) => (b.volume || 0) - (a.volume || 0));
                });
                setUpdatedSymbols(prev => new Set(prev).add(data.s));
                setTimeout(() => { setUpdatedSymbols(prev => { const newSet = new Set(prev); newSet.delete(data.s); return newSet; }); }, 750);
                if (isLoading) setIsLoading(false); if (error) setError(null);
            } else if (data?.result === null && data?.id) { console.log("Sub confirmation:", data.id); }
            else if (data?.e === 'error') { console.log("WS stream error:", data.m); setError(`Stream error: ${data.m}. Using fallback.`); ws.close(); }
        };

        ws.onerror = (errorEvent) => {
            clearTimeout(connectTimeout); console.log("WS onerror:", errorEvent); setIsConnecting(false);
        };

        ws.onclose = (event) => {
            clearTimeout(connectTimeout); console.warn(`WS onclose: Code=${event.code}, Reason='${event.reason}', Clean=${event.wasClean}`); setIsConnecting(false);
            if (wsInstanceRef.current === ws) { setSocket(null); wsInstanceRef.current = null; } // Clear only if it's the current ref
            if (!event.wasClean) {
                console.warn("WebSocket closed unexpectedly. Triggering fallback & retry.");
                let errorMsg = `WebSocket connection lost (Code: ${event.code}). Using fallback data.`;
                if (event.code === 1006) errorMsg = `Connection failed (Code: ${event.code}). Check network/firewall. Using fallback data.`;
                if (!error || !error.startsWith('Stream error:')) { setError(errorMsg); }
                fetchMarketDataFallback(); scheduleRetry();
            } else { console.log("WebSocket closed cleanly."); }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isClient, isConnecting, socket, marketData.length, error, fetchMarketDataFallback, scheduleRetry]);

    // --- Main Connection Lifecycle Effect ---
    useEffect(() => {
        if (isClient && !socket && !isConnecting) {
            initializeMarketData(); // Attempt initial connection
        }
        // Unmount cleanup
        return () => {
            console.log("Cleanup: Unmounting ResponsiveMarketPerformance...");
            clearTimeout(retryTimeoutRef.current);
            const wsToClose = wsInstanceRef.current;
            if (wsToClose) {
                console.log(`Cleanup: Closing WebSocket (readyState: ${wsToClose.readyState})`);
                wsToClose.onopen = null; wsToClose.onmessage = null; wsToClose.onerror = null; wsToClose.onclose = null;
                try { wsToClose.close(1000, "Component unmounting"); } catch (e) { console.warn("Error closing WS on unmount:", e) }
                wsInstanceRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isClient]);


    // --- Data Filtering Logic ---
    const getFilteredMarketData = useCallback(() => {
        if ((isLoading && marketData.length === 0) || marketData.length === 0) return [];
        const baseData = [...marketData].sort((a, b) => (b.volume || 0) - (a.volume || 0));
        switch (activeTab) {
            case 'top gainers': return baseData.filter(c => (c.change || 0) > 0).sort((a, b) => (b.change || 0) - (a.change || 0));
            case 'top losers': return baseData.filter(c => (c.change || 0) < 0).sort((a, b) => (a.change || 0) - (b.change || 0));
            default: return baseData;
        }
    }, [marketData, activeTab, isLoading]);


    // --- Main Component Render ---
    // Server Placeholder
    if (!isClient) {
        return (<section className="py-12 md:py-20 bg-[#111827]"> <div className="container mx-auto px-4"> <div className="max-w-6xl mx-auto"> <div className="text-center mb-10 md:mb-16"> <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-gray-100 mb-3 md:mb-4">Real-Time Market Performance</h2> <p className="font-accent text-sm md:text-base text-gray-400 max-w-2xl mx-auto">Loading live data...</p> </div> <div className="h-[400px] bg-gray-900/30 rounded-2xl flex items-center justify-center"><RefreshCw className="animate-spin text-indigo-500 w-8 h-8" /></div> </div> </div> </section>);
    }

    // Client Render
    const currentData = getFilteredMarketData();

    return (
        <section className="py-12 md:py-20 bg-[#111827] text-gray-200 font-accent">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-10 md:mb-16">
                         <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-500 mb-3 md:mb-4">Real-Time Market Performance</h2>
                         <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto flex items-center justify-center">
                            {/* Live Indicator */}
                            {socket && socket.readyState === WebSocket.OPEN ? (<motion.span className="mr-2 relative flex h-2.5 w-2.5" animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}> <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 motion-safe:animate-ping"></span> <span className="relative inline-flex rounded-full h-full w-full bg-teal-500"></span> </motion.span>) : (<span className="mr-2 relative flex h-2.5 w-2.5"><span className="relative inline-flex rounded-full h-full w-full bg-gray-600"></span></span>)}
                            Live cryptocurrency insights via Binance WebSocket
                        </p>
                    </div>
                    {/* Tabs */}
                    <div className="flex justify-center mb-8 md:mb-12">
                        <div className="relative flex space-x-1 bg-gray-800/50 rounded-full p-1.5 border border-gray-700/50">
                            {['overview', 'top gainers', 'top losers'].map((tab) => ( <motion.button key={tab} onClick={() => setActiveTab(tab)} className={`relative px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-medium z-10 transition-colors duration-200 ${activeTab !== tab ? 'text-gray-400 hover:text-white' : ''}`} style={{ outline: 'none' }}> {activeTab === tab && (<motion.div layoutId="activeTabIndicatorPerformance" className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full shadow-md z-0" initial={false} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />)} <span className="relative z-10">{tab === 'overview' ? 'Overview' : tab === 'top gainers' ? 'Top Gainers' : 'Top Losers'}</span> </motion.button> ))}
                        </div>
                    </div>
                    {/* Main Content Area */}
                    <div className="bg-gray-900/40 backdrop-blur-md border border-gray-700/80 rounded-2xl overflow-hidden shadow-xl min-h-[450px] flex flex-col">
                        {/* Conditional Rendering without extra AnimatePresence */}
                        {isLoading && currentData.length === 0 ? (<LoadingState />)
                            : error ? (<ErrorState error={error} onRetry={initializeMarketData} />)
                            : currentData.length > 0 ? (
                                // Render list directly - animations are inside the list/item components if enabled
                                isMobile ? (<MobileCardList data={currentData} updatedSymbols={updatedSymbols} />)
                                    : (<DesktopMarketTable data={currentData} updatedSymbols={updatedSymbols} />)
                            ) : (
                                // Show 'No assets' message if filters result in empty list
                                <div className="text-center p-10 text-gray-500 font-accent min-h-[300px] flex items-center justify-center"> No assets match the current filter. </div>
                            )}
                    </div>
                    {/* Reconnect Button */}
                    <div className="flex justify-center mt-8">
                        <motion.button onClick={initializeMarketData} disabled={isConnecting || !!socket} whileHover={{ scale: (!isConnecting && !socket) ? 1.03 : 1 }} whileTap={{ scale: (!isConnecting && !socket) ? 0.98 : 1 }} className="flex items-center bg-gray-800/60 border border-gray-700/80 text-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-700/80 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm" >
                            <RefreshCw className={`mr-2 w-4 h-4 ${(isConnecting) ? 'animate-spin' : ''}`} />
                            {isConnecting ? 'Connecting...' : socket ? 'Connected' : error ? 'Retry Connection' : 'Connect Stream'}
                        </motion.button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResponsiveMarketPerformance;