// Mock for @radix-ui/react-slot
const React = require('react');

const Slot = ({ children, ...props }) => {
  return React.createElement('div', props, children);
};

const createSlot = (name) => {
  return ({ children, ...props }) => {
    return React.createElement('div', { ...props, 'data-slot': name }, children);
  };
};

const Slottable = ({ children, ...props }) => {
  return React.createElement('div', props, children);
};

module.exports = {
  Slot,
  createSlot,
  Slottable,
  __esModule: true,
  default: { Slot, createSlot, Slottable }
};