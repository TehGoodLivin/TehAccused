# MIT License

Copyright (c) 2021 Austin L

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

# Teh-Accused
This bot enhances transparency in decision-making while maintaining order within the community. Server members participate in these votes, creating a democratic approach to moderating the server, ensuring fairness and community engagement.

> Written with Visual Studio Code (https://code.visualstudio.com/) 
> - Author: Austin Livengood

# How To
> - Setting up Discord Bot on Dev Portal: https://www.ionos.com/digitalguide/server/know-how/creating-discord-bot/
> - Host: https://pylexnodes.net/ (Free & Premium)

# Notes
> Written in Javascript with libraries discord.js, and dotenv.

# Commands
/accuse
> - Useage: /accuse target:<user> reason:<string> duration:<integer> (minutes)
> - Description: Starts a vote on a specified member, restricting them from sending messages and joining voice channels during the voting period.
> - Parameters:
>   - target: The member to be accused and voted on.
>   - reason: The reason for the accusation.
>   - duration: The duration of the vote in minutes.
> - Permissions: This command can only be executed by admins or users with a specific role.

/stopaccuse
> - Useage: /stopaccuse target:<user>
> - Description: Stops an active vote for a specified member and removes their timeout.
> - Parameters:
>   - target: The member whose vote you want to stop.
> - Permissions: This command can only be executed by admins or users with a specific role.

/settings
> - Sub Commands:
>   - /settings setchannel
>       - Description: Sets or clears the channel where general bot messages will be posted.
>       - Parameters:
>          - channel: The channel to send bot messages to (leave blank for none).
>          - none: Type "none" to clear the current channel.
>   - /settings setmodrole
>       - Description: Sets or clears the role required to execute bot commands.
>       - Parameters:
>          - role: The role that can use bot commands (leave blank for none).
>          - none: Type "none" to clear the current mod role.
>   - /settings setvotechannel
>       - Description: Sets or clears the channel where vote logs will be posted.
>       - Parameters:
>          - channel: The channel to post vote logs (leave blank for none).
>          - none: Type "none" to clear the current vote log channel.
>   - /settings viewconfig
>       - Description: Displays the current settings (channels and mod role).
> - Permissions: This command can only be executed by admins.
> - Description: Configure various bot settings such as the channel for messages, the role required to use commands, and the channel for vote logs.

/ping
> - Useage: /ping
> - Description: Checks the bot’s response time.
