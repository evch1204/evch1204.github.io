import { motion } from 'motion/react';
import { Linkedin, Mail } from 'lucide-react';
import Section from '@/components/Section';
import { LINKEDIN_URL, MAILTO } from '@/content/site';

export default function ContactPage() {
  return (
    <Section title="Connect">
      <div className="max-w-2xl mx-auto text-center py-6 sm:py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-7 sm:p-12 rounded-[2rem] sm:rounded-[3rem] bg-white border border-zinc-100 shadow-[0_32px_64px_rgba(0,0,0,0.03)]"
        >
          <h3 className="text-3xl sm:text-4xl font-bold mb-6 tracking-tight text-zinc-900">
            Let's build something.
          </h3>
          <p className="text-zinc-500 mb-8 sm:mb-12 text-base sm:text-lg font-medium leading-relaxed">
            I'm currently looking for new opportunities in AI and Software Engineering. Whether you have a question or just want to say hi, my
            inbox is always open.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={MAILTO}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 sm:px-10 sm:py-5 rounded-full bg-zinc-900 text-white font-bold hover:bg-black hover:scale-105 transition-all duration-300 shadow-xl shadow-zinc-200"
            >
              <Mail size={20} /> Send an Email
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 sm:px-10 sm:py-5 rounded-full border border-zinc-200 bg-white text-zinc-900 font-bold hover:bg-zinc-50 hover:scale-105 transition-all duration-300"
            >
              <Linkedin size={20} /> LinkedIn
            </a>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
