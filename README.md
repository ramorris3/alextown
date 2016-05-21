# TRACE ITALIENNE

# TO RUN THE PROJECT
1. Download and install node (https://nodejs.org/en/)
2. `sudo npm install -g gulp`
3. `sudo npm install -g nodemon`
4. Open terminal and cd to project root folder (trace-italienne/):
5. `npm install`
    - This should install all the packages you need to run the `gulp` builder (next step) and to run the local server.
    - See `package.json` in the root folder for more details.
6. `gulp build` 
    - This runs the JS linter/minifier.  It concatenates all javascript and CSS files in client/editor, minifies them, and puts them each one file: `dist/all.min.js` and `dist/all.min.css`
    - If you want to run/test the project while you are writing code, just type `gulp` instead of `gulp build`, and then leave it running in the terminal.  `gulp build` builds the dist files and quits, but `gulp` builds the files, and then rebuilds them whenever it detects a change in your code.
    - For more details, look at `gulpfile.js` in the root folder.
7. Type `npm run editor` to spin up the editor server
8. Go to `localhost:2000` in your browser and have at it!

[https://monosnap.com/file/7Na7FkHMq4UfPdMeu66j2I4f2YRAPN]

*Notes:*
- Images are uploaded to ~/uploads/ within the project.
- Levels are saved to ~/stages/
- The Enemy editor takes png files.  We should only be using png's anyway, because they support transparency
- I didn't bullet-proof input, so don't QA this thing.  Just run some basic tests to check functionality, watch the console to make sure you're not getting any errors, etc.

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

# TO DO
 - Implement AI for a simple enemy (prototype in sandbox)
 - Design and implement enemy editor
   - Save and load enemies within enemy editor
   - Load enemies made with editor into game and level-editor

# ENEMY OPTIONS
*General:*
 - Name
 - Class: Infantry, Marksman, Scout
 - Description
 - Portrait

*Movement:*
 - Speed (px per frame)
 - Follow, Avoid, or March
 - Flinch when hit? (bool)

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
