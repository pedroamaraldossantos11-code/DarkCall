<![CDATA[<div align="center">

# 🤝 Contributing to DarkCall

Thank you for your interest in contributing to DarkCall!

[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg)](#how-to-contribute)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-blue.svg)](#pull-requests)

</div>

---

## 📋 Table of Contents

- [How to Contribute](#how-to-contribute)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)

---

## How to Contribute

### Reporting Bugs 🐛

1. Check if the bug already exists in [Issues](https://github.com/yourusername/DarkCall/issues)
2. If not, create a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)

### Suggesting Features 💡

1. Check existing [Issues](https://github.com/yourusername/DarkCall/issues) and [Discussions](https://github.com/yourusername/DarkCall/discussions)
2. Create a new issue with the `feature-request` label
3. Describe the feature and its use case

---

## Pull Requests

### Before You Start

1. Fork the repository
2. Create a new branch: `git checkout -b feature/amazing-feature`
3. Read the [Development Setup](#development-setup) section

### Making Changes

1. Make your changes
2. Test thoroughly
3. Update documentation if needed
4. Follow the [Code Style](#code-style) guidelines

### Submitting Your PR

1. Push to your fork: `git push origin feature/amazing-feature`
2. Open a Pull Request against `main`
3. Fill out the PR template
4. Link related issues

---

## Development Setup

### Prerequisites

- Python 3.10+
- Git
- Code editor (VS Code recommended)

### Setup Steps

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/DarkCall.git
cd DarkCall

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate  # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start development server
python server.py
```

### Project Structure

```
DarkCall/
├── server.py          # Backend server
├── script.js          # Frontend JavaScript
├── style.css          # Styles
├── index.html         # Main HTML file
├── requirements.txt   # Python dependencies
├── run.sh            # Development script
├── build-linux.sh    # Linux build script
└── static/           # Static files (for production)
```

---

## Code Style

### Python

- Follow PEP 8
- Use type hints where possible
- Keep functions focused and small
- Add docstrings for complex functions

```python
async def broadcast(room_code: str, message: dict, exclude: str | None = None):
    """Broadcast a message to all users in a room."""
    # Implementation
```

### JavaScript

- Use strict mode
- Use `const` and `let` (no `var`)
- Use modern ES6+ features
- Add comments for complex logic

```javascript
"use strict";

function generateRoomCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
}
```

### CSS

- Use CSS custom properties (variables)
- Follow BEM-like naming
- Keep responsive in mind

```css
.video-card {
    position: relative;
    border-radius: 17px;
    background: #0a1523;
}
```

---

## Commit Messages

Use clear, descriptive commit messages:

### Format

```
<type>: <description>

[optional body]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
git commit -m "feat: add screen sharing functionality"
git commit -m "fix: resolve WebSocket reconnection issue"
git commit -m "docs: update installation instructions"
```

---

## Questions?

Feel free to open an issue for any questions!

---

Thank you for contributing! 🎉
]]>