# Contributing to Blipee OS

Thank you for your interest in contributing to Blipee OS! We're building the future of building management through conversational AI, and we'd love your help.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/blipee-os.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Make your changes
5. Commit: `git commit -m "Add amazing feature"`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Development Setup

See the README.md for detailed setup instructions. Key points:

- Node.js 20+ required
- Use npm (not yarn) for consistency
- Set up your `.env.local` file
- Run `npm install` and `npm run dev`

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types without justification
- Use proper interfaces for all data structures
- Document complex functions with JSDoc

### React/Next.js
- Functional components only
- Use hooks for state management
- Follow Next.js 14 App Router patterns
- Keep components focused and reusable

### Styling
- Tailwind CSS for all styling
- Follow the glass morphism design system
- Use CSS variables for theme values
- Ensure dark/light mode compatibility

### AI Integration
- Follow the patterns in `/src/lib/ai/`
- Use proper error handling and fallbacks
- Document AI prompts and expected responses
- Test with multiple AI providers

## Commit Messages

Follow conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, missing semicolons, etc)
- `refactor:` Code changes that neither fix bugs nor add features
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Pull Request Process

1. Update documentation for any changed functionality
2. Add tests for new features
3. Ensure all tests pass: `npm test`
4. Verify no TypeScript errors: `npm run type-check`
5. Check linting: `npm run lint`
6. Update the README.md if needed

## What We're Looking For

### High Priority
- Performance optimizations
- Additional AI provider integrations
- Enhanced building system integrations
- Mobile responsiveness improvements
- Accessibility enhancements

### Feature Ideas
- Advanced analytics visualizations
- More dynamic UI components
- Additional language support
- Integration with IoT devices
- Enhanced voice capabilities

## Questions?

Feel free to open an issue for any questions or join our discussions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.