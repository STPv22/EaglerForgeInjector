(() => {
    PluginAPI.dedicatedServer.appendCode(function () {
        PluginAPI.addEventListener("processcommand", (event) => {
            if (!ModAPI.reflect.getClassById("net.minecraft.entity.player.EntityPlayerMP").instanceOf(event.sender.getRef())) { return }

            if (event.command.toLowerCase().startsWith("/spawnnpc")) {
                const world = event.sender.getServerForPlayer();
                const playerPos = event.sender.getPosition();

                // Create a fake "null" UUID as a string
                const nullUUID = "00000000-0000-0000-0000-000000000000";

                // Create a fake player entity with a string-based UUID
                const GameProfileClass = ModAPI.reflect.getClassById("com.mojang.authlib.GameProfile");
                const fakeProfile = GameProfileClass.constructors[2](
                    nullUUID, ModAPI.util.str("Steve")
                );

                const EntityPlayerMPClass = ModAPI.reflect.getClassById("net.minecraft.entity.player.EntityPlayerMP");
                const fakePlayer = EntityPlayerMPClass.constructors[1](
                    world.getMinecraftServer(), world.getRef(), fakeProfile, world.getPlayerInteractionManager()
                );

                // Set the player position
                fakePlayer.setPosition(playerPos.$getX(), playerPos.$getY(), playerPos.$getZ());

                // Add the fake player to the world
                world.addEntityToWorld(fakePlayer.getEntityId(), fakePlayer);

                // Send a confirmation message to the player
                event.sender.addChatMessage(ModAPI.reflect.getClassById("net.minecraft.util.ChatComponentText").constructors[0](ModAPI.util.str("Fake Steve has been spawned!")));

                event.preventDefault = true;
            }
        });
    });
})();
