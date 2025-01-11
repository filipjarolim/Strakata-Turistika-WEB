import {LuScanFace, LuPlusCircle} from "react-icons/lu";
import {Settings, User} from "lucide-react";

const tooltipIconClass = "mr-2"
const userMenuIconClass = "mr-2 h-4 w-4"

export const authprefix = {
    buttons: {
        "login": {
            "tooltip": {
                "label": "Continue to login",
                "icon": <LuScanFace className={tooltipIconClass} />
            },
            "label": "Login"
        },
        "register": {
            "tooltip": {
                "label": "Create an account",
                "icon": <LuPlusCircle className={tooltipIconClass} />
            },
            "label": "Join us"
        },
        "user": {
            "label": "Account",
            "menu": {
                "label": "My account",
                "options": [
                    {
                        "label": "Profile",
                        "shortcut": "⌘P",
                        "icon": <User className={userMenuIconClass} />
                    },
                    {
                        "label": "Settings",
                        "shortcut": "⌘S",
                        "icon": <Settings className={userMenuIconClass} />
                    }

                ]
            }
        }
    }
}