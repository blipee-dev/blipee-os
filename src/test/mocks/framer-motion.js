// Mock for framer-motion
const React = require('react');

const motion = {};
const animations = ['div', 'span', 'button', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'li', 'section', 'header', 'footer', 'nav', 'main', 'article', 'aside'];

animations.forEach(tag => {
  const MotionComponent = React.forwardRef(({ children, animate, initial, exit, transition, variants, whileHover, whileTap, ...props }, ref) => {
    return React.createElement(tag, { ...props, ref }, children);
  });
  MotionComponent.displayName = `motion.${tag}`;
  motion[tag] = MotionComponent;
});

const AnimatePresence = ({ children }) => children;
AnimatePresence.displayName = 'AnimatePresence';

const useAnimation = () => ({
  start: jest.fn(),
  stop: jest.fn(),
  set: jest.fn()
});

const useMotionValue = (initial) => ({
  get: () => initial,
  set: jest.fn(),
  onChange: jest.fn()
});

const useTransform = (value, input, output) => value;

const useSpring = (value, config) => value;

const useScroll = () => ({
  scrollX: { get: () => 0 },
  scrollY: { get: () => 0 },
  scrollXProgress: { get: () => 0 },
  scrollYProgress: { get: () => 0 }
});

const useInView = () => true;

const useAnimationControls = () => ({
  start: jest.fn(),
  stop: jest.fn(),
  set: jest.fn()
});

module.exports = {
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
  useInView,
  useAnimationControls,
  __esModule: true
};