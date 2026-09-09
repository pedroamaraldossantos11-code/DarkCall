# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within DarkCall, please send an email to pedroamaraldossantos11@gmail.com. All security vulnerabilities will be promptly addressed.

**Please do NOT report security vulnerabilities through public GitHub issues.**

## Security Measures

### WebRTC
- All video/audio streams are encrypted end-to-end
- No media data passes through the server
- Uses industry-standard SRTP encryption

### WebSocket
- Signaling messages are relayed, not stored
- No authentication tokens exposed
- Connection-only, no persistent storage

### Server
- No user data is permanently stored
- Chat history is ephemeral (lost on server restart)
- No tracking or analytics

## Best Practices for Deployment

1. **Always use HTTPS** in production
2. **Keep dependencies updated**
3. **Use a firewall** and only expose necessary ports
4. **Monitor logs** for suspicious activity
5. **Regular backups** of configuration

## Contact

For security concerns, contact: pedroamaraldossantos11@gmail.com
