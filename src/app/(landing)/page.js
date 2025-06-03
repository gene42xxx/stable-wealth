"use client";
import { useState, useEffect } from "react";
import Hero from "./components/Hero";
import Partner from "./components/Partner";
import TestimonialSection from "./components/Testimonials";
import FAQSection from "./components/Faq";
import InvestmentPlansOverview from "./components/InvestmentPlanOverview";
import RecentMarketPerformance from "./components/Market";
import ResponsiveMarketPerformance from "./components/Market";


export default function Home() {
    const [amount, setAmount] = useState(0);


    return (
        <>
            <Hero />
            <Partner />
            <TestimonialSection />
            <FAQSection />
            <InvestmentPlansOverview/>
            <ResponsiveMarketPerformance />
            
        </>
    );
}