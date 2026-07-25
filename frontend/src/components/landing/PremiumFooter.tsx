import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter, Mail, Sparkles } from 'lucide-react';

const footerLinks = {
  Product: ['Features', 'Pricing', 'Security', 'Roadmap'],
  Company: ['About', 'Blog', 'Careers', 'Contact'],
  Resources: ['Docs', 'API', 'Help', 'Community'],
  Legal: ['Privacy', 'Terms', 'Cookie', 'Compliance'],
};

const socials = [
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Mail, href: '#', label: 'Email' },
];

export default function PremiumFooter() {
  return (
    <footer className="relative border-t border-blue-400/10 bg-gradient-to-b from-slate-950/50 to-slate-950 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Pragyan AI
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              AI-powered career guidance platform helping students discover and achieve their dream careers.
            </p>
            {/* Socials */}
            <div className="flex gap-4">
              {socials.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:text-blue-200 transition-all"
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links], idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-4"
            >
              <h4 className="font-bold text-white text-sm uppercase tracking-wide">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-400 hover:text-blue-300 transition-colors hover:translate-x-1 inline-block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="py-12 border-y border-blue-400/10 grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="space-y-2">
            <h3 className="font-bold text-white">Stay Updated</h3>
            <p className="text-sm text-gray-400">
              Get the latest features, insights, and success stories delivered to your inbox.
            </p>
          </div>
          <motion.form
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-2"
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-blue-900/20 border border-blue-400/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Subscribe
            </motion.button>
          </motion.form>
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400"
        >
          <p>© 2024 Pragyan AI. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-blue-300 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-blue-300 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-blue-300 transition-colors">
              Cookies
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
