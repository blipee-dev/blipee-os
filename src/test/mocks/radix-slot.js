// Mock for @radix-ui/react-slot
const React = require('react');

const Slot = ({ children, ...props }) => {
  return React.createElement('div', props, children);
};
Slot.displayName = 'Slot';

const createSlot = (name) => {
  const SlotComponent = ({ children, ...props }) => {
    return React.createElement('div', { ...props, 'data-slot': name }, children);
  };
  SlotComponent.displayName = `Slot-${name}`;
  return SlotComponent;
};

const Slottable = ({ children, ...props }) => {
  return React.createElement('div', props, children);
};
Slottable.displayName = 'Slottable';

module.exports = {
  Slot,
  createSlot,
  Slottable,
  __esModule: true,
  default: { Slot, createSlot, Slottable }
};