using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;
using System.Collections.Concurrent;
using Microsoft.AspNet.SignalR.Hubs;

namespace RadialPuzzleMultiplayer
{
    [HubName("dispatcher")]
    public class DispatcherHub : Hub
    {
        static ConcurrentQueue<string> playQueue = new ConcurrentQueue<string>();
        static ConcurrentDictionary<string, string> playerToRoom = new ConcurrentDictionary<string, string>();
        static readonly int RequiredPlayers = 2;

        // TODO: No support for ppl leaving a game/queue
        public void Queue()
        {
            playQueue.Enqueue(this.Context.ConnectionId);
            if (playQueue.Count >= RequiredPlayers)
            {
                string groupName = Guid.NewGuid().ToString();
                for (int i = 0; i < RequiredPlayers; i++)
                {
                    string id;
                    playQueue.TryDequeue(out id);
                    playerToRoom.AddOrUpdate(id, groupName, (x, y) => groupName);
                    this.Clients.Client(id).gameStarted();
                    this.Groups.Add(id, groupName);
                }
            }
        }

        public void Rotate(float angle)
        {
            string room;
            if (playerToRoom.TryGetValue(this.Context.ConnectionId, out room))
            {
                this.Clients.OthersInGroup(room).rotated(this.Context.ConnectionId, angle);
            }
        }

        public void ChangeCircle(int circle)
        {
            string room;
            if (playerToRoom.TryGetValue(this.Context.ConnectionId, out room))
            {
                this.Clients.OthersInGroup(room).circleChanged(this.Context.ConnectionId, circle);
            }
        }

        public void Solved()
        {
            string room;
            if (playerToRoom.TryGetValue(this.Context.ConnectionId, out room))
            {
                this.Clients.OthersInGroup(room).solved(this.Context.ConnectionId);
            }
        }



    }
}