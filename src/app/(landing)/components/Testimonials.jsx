'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, useAnimationControls } from 'framer-motion';

// Mock data for testimonials (replace with your actual data)
const testimonials = [
    {
        id: 1,
        name: 'Daniel Carter',
        role: 'Full-time Crypto Investor',
        text: 'I\'ve been investing with Stable Wealth\'s USDT staking program for over 18 months now, and the consistent 8% monthly returns have completely transformed my passive income strategy. Their platform makes it incredibly easy to monitor my investments and reinvest my profits.',
        imageUrl: '/avatars/avatar4.png',
    },
    {
        id: 2,
        name: 'Morgan Clarke',
        role: 'Financial Advisor at GlobeSync',
        text: 'As a financial professional, I was skeptical about USDT investments until I tried Stable Wealth. Their transparent approach and consistent returns have made me recommend their platform to my own clients. My initial $10,000 USDT investment has grown to over $25,000 in just 14 months.',
        imageUrl: '/avatars/avatar1.png',
    },
    {
        id: 3,
        name: 'Madison Cooper',
        role: 'CEO, Beta Technologies',
        text: 'Stable Wealth\'s USDT investment program has been the perfect solution for our company\'s treasury management. We\'ve maintained liquidity while earning substantial returns on our stablecoin holdings. The 8% monthly profit has allowed us to fund new projects without touching our core capital.',
        imageUrl: '/avatars/avatar3.png',
    },
    {
        id: 4,
        name: 'James Rodriguez',
        role: 'Founder of GreenTech',
        text: 'After being burned by volatile crypto investments, Stable Wealth\'s USDT program was exactly what I needed. The stability of USDT combined with their impressive yield generation has given me peace of mind and consistent profits. I\'ve already referred five friends who are equally impressed!',
        imageUrl: '/avatars/avatar5.png',
    },
    // Add more testimonials to ensure continuous scrolling effect
    {
        id: 5,
        name: 'Emma Johnson',
        role: 'E-commerce Entrepreneur',
        text: 'Stable Wealth\'s USDT investment platform has been my secret weapon for business growth. I allocate 30% of my e-commerce profits to their program and use the monthly 8% returns to fund new product launches. It\'s like having an additional revenue stream without extra work.',
        imageUrl: '/avatars/avatar6.png',
    },
    {
        id: 6,
        name: 'Charles Robert',
        role: 'Early Retiree',
        text: 'At 52, I was looking for stable investments to fund my early retirement. Stable Wealth\'s USDT program delivers exactly what they promise - consistent monthly returns without the stress of market volatility. My $50,000 USDT investment now generates enough monthly income to cover all my living expenses.',
        imageUrl: '/avatars/avatar7.png',
    },
];

const TestimonialCarousel = () => {
    const controls = useAnimationControls();
    const containerRef = useRef(null);

    useEffect(() => {
        const startAnimation = async () => {
            // Get the width of the container and testimonials for proper animation
            const container = containerRef.current;
            if (!container) return;

            // Calculate total width of testimonials
            const totalWidth = container.scrollWidth;
            const viewportWidth = container.offsetWidth;

            // Set initial position
            await controls.set({ x: 0 });

            // Animate continuously
            await controls.start({
                x: [0, -totalWidth / 2],
                transition: {
                    duration: 80,
                    ease: "linear",
                    repeat: Infinity,
                    repeatType: "loop"
                }
            });
        };

        startAnimation();

        // Cleanup animation on unmount
        return () => controls.stop();
    }, [controls]);

    const TestimonialCard = ({ testimonial }) => (
        <div className="flex-shrink-0 w-full   md:w-[450px] h-[300px] p-6 mr-3 rounded-2xl bg-[#fafafa]  transition-all duration-300 hover:shadow-xl ">
            <div className="flex flex-col h-full">
                <div className="mb-6">
                    <p className="text-gray-400 text-sm md:text-base  font-accent italic">{testimonial.text}</p>
                </div>

                <div className="mt-auto flex items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-200 flex items-center justify-center">
                        {testimonial.imageUrl ? (
                            <Image
                                src={testimonial.imageUrl}
                                alt={testimonial.name}
                                width={48}
                                height={48}
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-primary-600 text-lg font-bold">
                                {testimonial.name.charAt(0)}
                            </span>
                        )}
                    </div>
                    <div className="ml-4">
                        <h4 className="text-neutral-800 font-bold font-display">{testimonial.name}</h4>
                        <p className="text-neutral-600 text-sm font-accent">{testimonial.role}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <section className="py-20 bg-neutral-200 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-neutral-900 mb-3 font-display">What <span className='text-primary-500'>Our Clients</span> Are Saying</h2>
                    <p className="text-lg text-neutral-700 max-w-2xl mx-auto font-accent">
                        Discover why investors trust StableWealth for secure USDT investments, consistent returns, and a transparent approach to crypto wealth management
                    </p>
                </div>

                <div className="relative w-full overflow-hidden" ref={containerRef}>
                    <motion.div
                        className="flex"
                        animate={controls}
                    >
                        {/* Double the testimonials to create seamless loop effect */}
                        {[...testimonials, ...testimonials].map((testimonial, index) => (
                            <TestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
                        ))}
                    </motion.div>
                </div>

                <div className="mt-12 text-center">
                    <button className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50">
                        Start Investing with StableWealth
                    </button>
                </div>
            </div>
        </section>
    );
};

export default TestimonialCarousel;