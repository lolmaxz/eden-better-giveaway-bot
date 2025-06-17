# Eden Better Giveaway Bot

A modern, feature-rich Discord giveaway bot built with TypeScript and SapphireJS. This bot provides a comprehensive giveaway system with role-based access, supporter benefits, and detailed management tools.

## Features

### Giveaway Management

- 🎉 Create giveaways with customizable duration, winners, and prizes
- 🖼️ Support for both image and thumbnail attachments
- 📝 Optional descriptions and role requirements
- ⏰ Automatic winner selection and announcement
- 🔄 Reroll functionality for completed giveaways
- 📊 Detailed entry tracking and statistics

### Role Integration

- 🛡️ Role-based access control
- ⭐ Supporter roles with extra entries
- 🔒 Whitelist role requirements
- 👥 Multiple role support (up to 5 roles)
- ✅ **Always Eligible Roles**: Specify roles that can always participate in giveaways, regardless of other requirements (Perfect for staff perks by example)

### Management Tools

- 📋 List active and completed giveaways
- 🔍 Detailed giveaway information
- 🗑️ Giveaway deletion with cleanup
- ⚙️ Server-specific configuration
- 🎨 Customizable entry button emoji

## Setup

### Prerequisites

- Node.js 22.14.0 or higher
- npm or yarn
- A Discord bot token
- SQLite (included)

### Installation

1. Clone the repository:

```sh
git clone https://github.com/yourusername/eden-better-giveaway-bot.git
cd eden-better-giveaway-bot
```

2. Install dependencies:

```sh
npm install
```

3. Create a `.env` file in the root directory with your bot token (or rename `.env.example` to `.env` and fill in your values):

```env
DISCORD_TOKEN=your_bot_token_here
```

### Development

Run the bot in development mode with hot-reload:

```sh
npm run watch:start
```

### Production

Build and run the bot:

```sh
npm run build
npm start
```

## Commands

### Giveaway Management

- `/start` - Start a new giveaway
- `/end` - End a giveaway early
- `/delete` - Delete a giveaway
- `/reroll` - Reroll the winner(s)
- `/list` - List giveaways

### Information

- `/giveawaydetails` - Show detailed entry info
- `/about` - Show bot information and commands
- `/bot-config` - Show information about the bot's config for your server

### Configuration

- `/gconfig special-role add` - Add a special supporter role
- `/gconfig special-role remove` - Remove a special supporter role
- `/gconfig set-reaction-emoji` - Set the entry button emoji
- `/gconfig eligible-roles add` - Add a role that is always eligible for giveaways
- `/gconfig eligible-roles remove` - Remove a role from the always eligible list (with autocomplete)
- `/gconfig eligible-roles list` - List all always eligible roles

## Contributing

Feel free to contribute to this project by:

1. Forking the repository
2. Creating a feature branch
3. Committing your changes
4. Pushing to the branch
5. Creating a Pull Request

## License

This project is open source and available under the MIT License. Feel free to use, modify, and distribute it as you wish.

## Credits

Created by [lolmaxz](https://github.com/lolmaxz) for The Eden Apis community.

Built with:

- [SapphireJS](https://github.com/sapphiredev/framework)
- [Discord.js](https://discord.js.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma](https://www.prisma.io/)
