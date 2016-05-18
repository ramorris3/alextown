# TRACE ITALIENNE
http://alextown.cmerkley.whsites.net/
```
                        ^    ^
                       / \  //\
         |\___/|      /   \//  .\
         /O  O  \__  /    //  | \ \
        /     /  \/_/    //   |  \  \
        @___@'    \/_   //    |   \   \ 
           |       \/_ //     |    \    \ 
           |        \///      |     \     \ 
          _|_ /   )  //       |      \     _\
         '/,_ _ _/  ( ; -.    |    _ _\.-~        .-~~~^-.
         ,-{        _      `-.|.-~-.           .~         `.
          '/\      /                 ~-. _ .-~      .-~^-.  \
             `.   {            }                   /      \  \
           .----~-.\        \-'                 .~         \  `. \^-.
          ///.----..>    c   \             _ -~             `.  ^-`   ^-_
            ///-._ _ _ _ _ _ _}^ - - - - ~                     ~--,   .-~
```

# ENEMY OPTIONS
*General:*
 - Name
 - Class: Infantry, Marksman, Scout, Elemental Ice, Elemental Fire
 - Description
 - Portrait

*Movement:*
 - Speed (px per frame)
 - Follow, Avoid, or March

*Attack:*
 - Attack Speed (frames per cooldown)
 - Melee or Ranged
   - Melee options: Regular or Suicide
   - Ranged options: 
     - Pattern: Straight, Burst (forward), Fan, Radius, Horizontal Double, Vertical Double, X
     - Bullet Type: Firearm, Arrow, Ice, Fire

 *Sprites:*
 - For each animation:
   - Dimensions
   - Number of frames
 - Animations (separate files): 
   - Advance
   - Die
   - Take Damage
   - Attack (Either Melee or Ranged)
     - Melee: Duration of animation == duration of attack
     - Ranged: Each animation spawns one "shot" of bullet/bullets

 *Stats:*
  - Movement Speed (px per frame)
  - Attack Cooldown (frames per cooldown)
  - Damage
  - Health
  - XP
