import base64

class ClothingItem:
    def __init__(self, image, id = None, category = None, type = None, colors = None, occasions = None, temperatures = None):
        self.image = image
        self.id = id
        self.category = category
        self.type = type
        self.colors = colors
        self.occasions = occasions
        self.temperatures = temperatures

    def update_id(self, id):
        self.id = id
    
    def update_labels(self, category, type, colors, occasions, temperatures):
        self.category = category
        self.type = type
        self.colors = colors
        self.occasions = occasions
        self.temperatures = temperatures

    def get_labels(self):
        return {
            "category": self.category,
            "type": self.type,
            "colors": self.colors,
            "occasions": self.occasions,
            "temperatures": self.temperatures
        }
    
    def get(self):
        return {
            "id": self.id,
            "image": base64.b64encode(self.image).decode("utf-8"),
            "category": self.category,
            "type": self.type,
            "colors": self.colors,
            "occasions": self.occasions,
            "temperatures": self.temperatures
        }