import React, { useMemo, useState, useEffect } from 'react';
import moment from 'moment'; // Ensure moment.js is installed: npm install moment
import {
    ResponsiveContainer,
    AreaChart, Area,
    PieChart as RechartsPieChart, Pie, Cell, // Renamed PieChart import to avoid conflict
    BarChart as RechartsBarChart, Bar,      // Renamed BarChart import to avoid conflict
    XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts'; // Ensure recharts is installed: npm install recharts
// Ensure lucide-react is installed: npm install lucide-react
import {
    PieChart,          // Replacement for ChartPieIcon
    BarChart3,         // Replacement for ChartBarIcon
    Clock,             // Replacement for ClockIcon
    Info,              // Replacement for InformationCircleIcon
    AlertCircle,       // Replacement for ExclamationCircleIcon
    DollarSign,        // Replacement for CurrencyDollarIcon
    TrendingUp,        // Replacement for TrendingUpIcon
    TrendingDown,      // Replacement for TrendingDownIcon
    Scale,             // Replacement for ScaleIcon
    Tag                // Replacement for TagIcon
} from 'lucide-react';

// --- Helper: StatBox Component ---
const StatBox = React.memo(({ label, value, color, icon: Icon, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-black/5 p-4 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-600 rounded w-1/2"></div>
            </div>
        );
    }

    return (
        <div className="bg-black/5 p-4 rounded-lg text-center transition-all duration-300 hover:bg-black/10 hover:scale-[1.03] cursor-default flex flex-col items-center justify-center">
            <div className="flex items-center text-sm text-gray-400 mb-1">
                {Icon && <Icon className="h-4 w-4 mr-1.5 flex-shrink-0" strokeWidth={1.5} />}
                <span>{label}</span>
            </div>
            <div className={`text-xl font-bold ${color}`}>
                ${typeof value === 'number' ? value.toFixed(2) : value}
            </div>
        </div>
    );
});
StatBox.displayName = 'StatBox';


// --- Helper: Card Component ---
const AnalyticsCard = ({ title, icon: Icon, children, isLoading, className = "" }) => {
    const cardBaseStyle = "bg-gradient-to-br from-purple-500/5 to-purple-600/15 backdrop-blur-lg border border-white/10 rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl";
    const cardPadding = "p-5 md:p-6";
    const cardTitleStyle = "text-lg font-semibold text-gray-200 mb-4 flex items-center";

    return (
        <div className={`${cardBaseStyle} ${className}`}>
            <div className={`${cardPadding} pb-0`}>
                <h3 className={`${cardTitleStyle}`}>
                    {Icon && <Icon className="h-5 w-5 mr-2 text-gray-400 flex-shrink-0" strokeWidth={1.5} />}
                    {isLoading ? <span className="h-5 bg-gray-700 rounded w-1/2 animate-pulse"></span> : title}
                </h3>
            </div>
            <div className={`${cardPadding} pt-2 h-full`}>
                {children}
            </div>
        </div>
    );
};


// --- Skeleton Loader for Charts ---
const ChartSkeleton = () => (
    <div className="h-72 w-full p-4 flex items-center justify-center bg-black/5 rounded-lg animate-pulse">
        <Info className="h-16 w-16 text-gray-600 animate-pulse" strokeWidth={1} />
    </div>
);


// --- Main TransactionAnalytics Component ---
const TransactionAnalytics = React.memo(({ transactions, isLoading = false }) => {
    const [hasError, setHasError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation shortly after mount/load
        if (!isLoading) {
            const timer = setTimeout(() => setIsVisible(true), 100);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false); // Reset if loading state changes back
        }
    }, [isLoading]);

    // --- Memoized Data Processing ---
    const processedData = useMemo(() => {
        if (!transactions || transactions.length === 0) {
            // Return empty structure if no transactions
            return { typeData: [], statusData: [], timeData: [], summary: {} };
        }
        try {
            setHasError(false); // Reset error state on successful processing

            // Calculate Type Distribution (Count)
            const typeData = transactions.reduce((acc, tx) => {
                const type = tx.type || 'unknown'; // Handle missing type
                const existing = acc.find(item => item.name === type);
                if (existing) {
                    existing.value += 1;
                } else {
                    acc.push({ name: type, value: 1 });
                }
                return acc;
            }, []);

            // Calculate Status Distribution (Count)
            const statusData = transactions.reduce((acc, tx) => {
                const status = tx.status || 'unknown'; // Handle missing status
                const existing = acc.find(item => item.name === status);
                if (existing) {
                    existing.value += 1;
                } else {
                    acc.push({ name: status, value: 1 });
                }
                return acc;
            }, []);

            // Calculate Time Series Data (Sum Amount by Type per Day)
            const timeData = transactions.reduce((acc, tx) => {
                // Ensure createdAt is valid before formatting
                const date = moment(tx.createdAt).isValid() ? moment(tx.createdAt).format('MMM D') : 'Invalid Date';
                if (date === 'Invalid Date') return acc; // Skip transactions with invalid dates

                let existing = acc.find(item => item.date === date);
                if (!existing) {
                    // Initialize day entry with all expected types
                    existing = { date, deposit: 0, withdrawal: 0, profit: 0, fee: 0, subscription: 0 };
                    acc.push(existing);
                }
                const type = tx.type || 'unknown';
                // Add amount only if the type is a key in our initialized object
                if (typeof existing[type] === 'number') {
                    existing[type] += tx.amount || 0; // Handle missing amount
                }
                return acc;
            }, []);

            // Sort time data chronologically
            timeData.sort((a, b) => moment(a.date, 'MMM D').valueOf() - moment(b.date, 'MMM D').valueOf());

            // Calculate Summary Statistics
            const totalDeposits = transactions.filter(tx => tx.type === 'deposit').reduce((sum, tx) => sum + (tx.amount || 0), 0);
            const totalWithdrawals = transactions.filter(tx => tx.type === 'withdrawal').reduce((sum, tx) => sum + (tx.amount || 0), 0);
            const totalProfit = transactions.filter(tx => tx.type === 'profit').reduce((sum, tx) => sum + (tx.amount || 0), 0);
            const totalFees = transactions.filter(tx => tx.type === 'fee').reduce((sum, tx) => sum + (tx.amount || 0), 0);
            const totalSubscriptions = transactions.filter(tx => tx.type === 'subscription').reduce((sum, tx) => sum + (tx.amount || 0), 0);
            const netFlow = totalDeposits - totalWithdrawals;

            // Return all processed data
            return {
                typeData,
                statusData,
                timeData,
                summary: {
                    totalDeposits,
                    totalWithdrawals,
                    totalProfit,
                    totalFees,
                    totalSubscriptions,
                    netFlow
                }
            };

        } catch (error) {
            // Log error and set error state
            console.error("Error processing transaction data:", error);
            setHasError(true);
            // Return empty structure on error
            return { typeData: [], statusData: [], timeData: [], summary: {} };
        }
    }, [transactions]); // Dependency: Only recompute when transactions change

    // Destructure processed data
    const { typeData, statusData, timeData, summary } = processedData;

    // --- Styling & Config (Constants) ---
    const COLORS = ['#10813AFF', '#F87171', '#60A5FA', '#FBBF24', '#A78BFA', '#FB923C', '#94A3B8']; // Green, Red, Blue, Yellow, Purple, Orange, Gray
    const axisTickStyle = { fill: '#a1a1aa', fontSize: '11px' }; // Zinc-400 for ticks
    const currencyFormatter = (value) => `$${value.toLocaleString()}`; // Format Y-axis ticks

    // --- Custom Tooltip ---
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black/5 backdrop-blur-sm p-3 border border-white/30 rounded-lg shadow-md text-xs">
                    <p className="text-sm font-medium text-white mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="flex justify-between items-center">
                            <span className='capitalize'>{entry.name}:</span>
                            <span className='ml-2 font-medium'>
                                {/* Show count for status/type charts, currency for time chart */}
                                {entry.payload && (entry.payload.deposit !== undefined || entry.payload.withdrawal !== undefined)
                                    ? `$${entry.value.toFixed(2)}`
                                    : entry.value}
                            </span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Pie Chart Label Renderer
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.6; // Position label closer to center
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        const percentage = (percent * 100).toFixed(0);
        // Avoid label overlap by rendering only if percent is large enough
        if (percentage < 5) return null;
        return (
            <text
                x={x}
                y={y}
                fill="#e5e7eb" // Light gray/white text
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize="11px"
                fontWeight="medium"
                className="capitalize" // Capitalize type name
            >
                {`${name} ${percentage}%`}
            </text>
        );
    };


    // --- Render Logic ---

    // Error State
    if (hasError) {
        return (
            <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center h-64 bg-red-900/30 backdrop-blur-sm rounded-2xl border border-red-500/50 p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" strokeWidth={1.5} />
                <p className="text-red-300 text-lg font-semibold">Error Analyzing Data</p>
                <p className="text-red-400 text-sm">Could not process transaction data. Please check the console for details.</p>
            </div>
        );
    }

    // No Data State (after loading is complete)
    if (!isLoading && (!transactions || transactions.length === 0)) {
        return (
            <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center h-64 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center">
                <Info className="h-12 w-12 text-gray-500 mb-4" strokeWidth={1.5} />
                <p className="text-center text-gray-400 text-lg">
                    No transaction data available for analysis.
                </p>
                <p className="text-center text-gray-500 text-sm mt-1">
                    Once transactions are added, insights will appear here.
                </p>
            </div>
        );
    }


    // Main Grid Layout
    return (
        <div className={`p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>

            {/* Time Series Chart Card */}
            <AnalyticsCard title="Transaction History" icon={Clock} isLoading={isLoading} className="lg:col-span-2">
                {isLoading ? <ChartSkeleton /> : (
                    <div className="h-72 w-full pb-4 pr-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                                <defs>
                                    {/* Define gradients for Area fills based on actual keys present */}
                                    {Object.keys(timeData[0] || {})
                                        .filter(key => key !== 'date')
                                        .map((key, index) => (
                                            <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.7} />
                                                <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1} />
                                            </linearGradient>
                                        ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4b556330" /> {/* Dim grid lines */}
                                <XAxis dataKey="date" tick={axisTickStyle} />
                                <YAxis tick={axisTickStyle} tickFormatter={currencyFormatter} />
                                <Tooltip content={<CustomTooltip />} />
                                {/* Dynamically create Area components based on data keys */}
                                {Object.keys(timeData[0] || {})
                                    .filter(key => key !== 'date') // Exclude date key
                                    .map((key, index) => (
                                        <Area
                                            key={key}
                                            type="monotone"
                                            dataKey={key}
                                            stackId="1" // Keep stacking
                                            stroke={COLORS[index % COLORS.length]}
                                            strokeWidth={1.5}
                                            fillOpacity={1}
                                            fill={`url(#color${key})`} // Use gradient fill
                                            name={key.charAt(0).toUpperCase() + key.slice(1)} // Capitalize name for legend/tooltip
                                        />
                                    ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </AnalyticsCard>

            {/* Summary Statistics Card */}
            <AnalyticsCard title="Summary" icon={Scale} isLoading={isLoading}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                    <StatBox label="Deposits" value={summary.totalDeposits} color="text-green-400" icon={TrendingUp} isLoading={isLoading} />
                    <StatBox label="Withdrawals" value={summary.totalWithdrawals} color="text-red-400" icon={TrendingDown} isLoading={isLoading} />
                    <StatBox label="Net Flow" value={summary.netFlow} color={summary.netFlow >= 0 ? 'text-green-400' : 'text-red-400'} icon={Scale} isLoading={isLoading} />
                    <StatBox label="Profit" value={summary.totalProfit} color="text-blue-400" icon={DollarSign} isLoading={isLoading} />
                    <StatBox label="Fees" value={summary.totalFees} color="text-yellow-500" icon={Tag} isLoading={isLoading} />
                    <StatBox label="Subscriptions" value={summary.totalSubscriptions} color="text-purple-400" icon={Tag} isLoading={isLoading} />
                </div>
            </AnalyticsCard>


            {/* Transaction Types Distribution Card */}
            <AnalyticsCard title="Transaction Types" icon={PieChart} isLoading={isLoading}>
                {isLoading ? <ChartSkeleton /> : (
                    <div className="h-64 md:h-72 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie
                                    data={typeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius="85%" // Make pie larger
                                    fill="#8884d8" // Default fill (overridden by Cells)
                                    dataKey="value"
                                    stroke="none" // No border between slices
                                    nameKey="name" // Use 'name' field for legend/tooltip identification
                                >
                                    {typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    iconSize={10}
                                    wrapperStyle={{ fontSize: "11px", color: '#d1d5db', paddingTop: '10px' }}
                                    formatter={(value) => <span className="capitalize">{value}</span>} // Capitalize legend item text
                                />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </AnalyticsCard>

            {/* Status Distribution Card (Example - uncomment if needed) */}
            
      <AnalyticsCard title="Transaction Status" icon={BarChart3} isLoading={isLoading}>
         {isLoading ? <ChartSkeleton /> : (
            <div className="h-72 w-full pb-4 pr-2">
              <ResponsiveContainer width="100%" height="100%">
                 <RechartsBarChart data={statusData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b556330" />
                  <XAxis dataKey="name" tick={axisTickStyle} />
                  <YAxis tick={axisTickStyle} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.08)' }} />
                  <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]} > // Slightly rounded top bars
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
         )}
      </AnalyticsCard>
     

        </div>
    );
});
TransactionAnalytics.displayName = 'TransactionAnalytics'; // Add display name for React DevTools

export default TransactionAnalytics;