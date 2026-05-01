import React from "react";
import { Books, SealCheck, UsersThree, Medal, Ticket } from "@phosphor-icons/react";

export const audience = [
  { 
    title: "Specialists", 
    price: "$49",
    type: "ENTRY",
    desc: "Specialists building early experience and professional direction.", 
    img: "https://images.unsplash.com/photo-1659886061101-56a318ec09df?q=80&w=800" 
  },
  { 
    title: "Beauty Professionals", 
    price: "$199",
    type: "ELITE",
    desc: "Practicing beauty specialists including brow artists, lash artists, makeup artists, cosmetologists, estheticians, PMU artists, nail professionals, and hair professionals.", 
    img: "https://images.unsplash.com/photo-1762522903557-891c8dc11f4b?q=80&w=800" 
  },
  { 
    title: "Educators & Trainers", 
    price: "$399",
    type: "MASTER",
    desc: "Teachers, trainers, academies, and educational platforms working in beauty education.", 
    img: "https://images.unsplash.com/photo-1559185590-d545a0c5a1dc?q=80&w=800" 
  },
  { 
    title: "Business Owners", 
    price: "$599",
    type: "PREMIUM",
    desc: "Owners of beauty salons, studios, beauty spaces, and other beauty businesses.", 
    img: "https://images.unsplash.com/photo-1746021375246-7dc8ab0583f0?q=80&w=800" 
  },
  { 
    title: "Brands & Companies", 
    price: "$1,299",
    type: "PARTNER",
    desc: "Beauty brands, distributors, manufacturers, and service companies working within the beauty industry.", 
    img: "https://images.unsplash.com/photo-1708486235073-14879ff14c4c?q=80&w=800" 
  }
];

export const whyJoin = [
  {
    title: "Education",
    icon: <Books weight="thin" size={40} className="text-[#B9D9EB]" />,
    desc: "Access to educational programs, webinars, resources, and professional development materials."
  },
  {
    title: "Standards",
    icon: <SealCheck weight="thin" size={40} className="text-[#B9D9EB]" />,
    desc: "Professional standards, best practices, and ethical guidelines for working in the beauty industry."
  },
  {
    title: "Community",
    icon: <UsersThree weight="thin" size={40} className="text-[#B9D9EB]" />,
    desc: "A global professional network connecting beauty experts from around the world."
  },
  {
    title: "Recognition",
    icon: <Medal weight="thin" size={40} className="text-[#B9D9EB]" />,
    desc: "Professional recognition through membership certification, member directory listings, and official association credentials."
  },
  {
    title: "Events",
    icon: <Ticket weight="thin" size={40} className="text-[#B9D9EB]" />,
    desc: "Access to conferences, workshops, networking events, industry forums, and professional competitions."
  }
];

export const packages = [
  { name: "Specialist", price: "$49", type: "ENTRY" },
  { name: "Professional", price: "$199", type: "ELITE" },
  { name: "Educator", price: "$399", type: "MASTER" },
  { name: "Business", price: "$599", type: "PREMIUM" },
  { name: "Brand", price: "$1,299", type: "PARTNER" }
];

export const upcomingEvents = [
  {
    date: "June 15-17, 2026",
    name: "Global Beauty Summit 2026",
    location: "Sacramento, CA / Convention Center",
    img: "https://images.unsplash.com/photo-1542764140-f38e04d3e0c4?q=80&w=800"
  },
  {
    date: "August 22, 2026",
    name: "Advanced PMU Masterclass",
    location: "Online / Virtual Format",
    img: "https://images.unsplash.com/photo-1737063989672-67d79de1b2f7?q=80&w=800"
  },
  {
    date: "October 10, 2026",
    name: "Intl Lash & Brow Cup",
    location: "Paris, France / Hybrid",
    img: "https://images.unsplash.com/photo-1735151226446-1d364b4adc2f?q=80&w=800"
  }
];

export const industryNews = [
  {
    category: "Industry Trends",
    title: "The Rise of Sustainable Beauty Tech in 2026",
    date: "March 10, 2026",
    img: "https://images.unsplash.com/photo-1619834043185-acbe47811e6a?q=80&w=800"
  },
  {
    category: "Association News",
    title: "IBPA Announces New Educational Partnership",
    date: "March 05, 2026",
    img: "https://images.unsplash.com/photo-1766113479701-f3d0a8583088?q=80&w=800"
  },
  {
    category: "Professional Growth",
    title: "Mastering the Art of Digital Client Consultations",
    date: "February 28, 2026",
    img: "https://images.unsplash.com/photo-1715848504111-9b3a586fc0a9?q=80&w=800"
  }
];
