import os

filepath = 'src/lib/realtimeManager.ts'
with open(filepath, 'r') as f:
    content = f.read()

off_method = """
  public off(eventOrCollection: string, callback: RealtimeCallback | (() => void)) {
    const subKey = eventOrCollection.split('/')[0];
    const currentSet = this.listeners.get(subKey);
    if (currentSet) {
      currentSet.delete(callback as any);
      if (currentSet.size === 0) {
        this.listeners.delete(subKey);
        if (this.isConnected && this.isAuthenticated) {
          this.send({
            type: 'unsubscribe',
            collection: subKey
          });
        }
      }
    }
  }
"""

# Insert before private dispatch(event: RealtimeEvent) {
dispatch_idx = content.find("  private dispatch(event: RealtimeEvent) {")
if dispatch_idx != -1:
    content = content[:dispatch_idx] + off_method + content[dispatch_idx:]
    with open(filepath, 'w') as f:
        f.write(content)
    print("Added off method")
else:
    print("Could not find dispatch method")
