import {Settings, User, ScanFace, CirclePlus} from "lucide-react";

const tooltipIconClass = "mr-2"
const userMenuIconClass = "mr-2 h-4 w-4"

export const authprefix = {
    buttons: {
        "login": {
            "tooltip": {
                "label": "Pokračovat k přihlášení",
                "icon": <ScanFace className={tooltipIconClass} />
            },
            "label": "Login"
        },
        "register": {
            "tooltip": {
                "label": "Vytvořit účet",
                "icon": <CirclePlus className={tooltipIconClass} />
            },
            "label": "Připojte se"
        },
        "user": {
            "label": "Účet",
            "menu": {
                "label": "Můj účet",
                "options": [
                    {
                        "label": "Profil",
                        "icon": <User className={userMenuIconClass} />,
                        "href": "/auth/profil"
                    },
                    {
                        "label": "Nastavení",
                        "icon": <Settings className={userMenuIconClass} />,
                        "href": "/nastaveni"
                    }

                ]
            }
        }
    }
}