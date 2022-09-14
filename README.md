Many people have wished that there was an iOS widget for the Tibber app, but alas there is none.
However, Tibber has a fantastic [API](https://developer.tibber.com/), so you can create it yourself!;)

## Here is the procedure
1. Download the "Scriptable" app:  https://apps.apple.com/no/app/scriptable/id1405459188
2. Start the app, press the "+" in the top right corner
3. Press the text "Untitled Scripts" at the very top and change the name to "TibberSmall"/"TibberMedium"/"TibberLarge" (depending on what size widget you want).
4. Paste the code from one of the desired files, depending on the size that you want:
   1. For a small widget, paste [this code](/TibberSmall.js?raw=1) into TibberSmall
   <img src="/img/small.jpg" width="200px" />
   
   2. For a medium widget, paste [this code](/TibberMedium.js?raw=1) into TibberMedium
   <img src="/img/medium.jpeg" width="500px" />
   
   3. For a large widget, paste [this code](/TibberLarge.js?raw=1) into TibberLarge
   <img src="/img/large.jpg" width="500px" />

1. Find your personal Tibber token by logging in with your Tibber account here: https://developer.tibber.com/settings/accesstoken

2. Replace the token on the line with "TIBBERTOKEN=" in the script with your personal token and select "Done".

3. For TibberLarge, set the variable in line 34 to true or false to choose whether to display with net rent. Also remember to change the amounts in lines 35 and 36.

4. Close the "Scriptable" app and press and hold on the home screen where you want the widget (so the apps start "shaking"), press the "+" on the top left, select "Scriptable". Choose small, medium or large widget and press "Add widget".

5. Widget is now there with "Select script in widget configurator". Tap and hold on it and select "Edit Widget".

6.  For "Script", select "TibberSmall"/"TibberMedium"/"TibberLarge" (depending on which size widget you selected),
 - "When interacting"="Open URL",
 - "URL"="tibber://"
 - If you have multiple "homes" (cabin, perhaps), enter 0, 1 or 2 (etc) as "parameter" to select which house you want to display.

 Widget is now ready to use! :) 

## Input, issues or other discussions
Feel free to make suggestions for changes or share your own improvements!

Use Github or join the Norwegian home automation community here (english posts also welcome):
https://www.hjemmeautomasjon.no/forums/topic/9453-guide-tibber-widget-for-ios/

## Hey, advanced users!
If you want to edit and test your scripts on a computer and happen to have a Mac, you can try the [Scriptable Beta for Mac](https://scriptable.app/mac-beta/).
