import cgi
import datetime
import urllib
import wsgiref.handlers
import time
import string

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api import memcache

class Reputation(db.Model):
    """Models an individual Guestbook entry with an author, content, and date."""
    repper = db.StringProperty()
    reppername = db.StringProperty()
    repped = db.StringProperty()
    board = db.StringProperty()
    amount = db.StringProperty(choices=['-1','1'])
    reason = db.StringProperty(multiline=True)
    date = db.DateTimeProperty(auto_now_add=True)

class CumulRep(db.Model):
    repped = db.StringProperty()
    board = db.StringProperty()
    total = db.IntegerProperty()

class NewBoard(db.Model):
    negative = db.BooleanProperty()
    board = db.StringProperty()
    admin = db.StringProperty()
    time = db.StringProperty()

class RepUsers(db.Model):
    user = db.StringProperty()
    password = db.StringProperty()
    board = db.StringProperty()
    
def reputation_key(board_name=None):
    """Constructs a datastore key for a Guestbook entity with guestbook_name."""
    return db.Key.from_path('Reputation', board_name or 'legitboard')
   
def cumul_key(board_name=None):
    """Constructs a datastore key for a Guestbook entity with guestbook_name."""
    return db.Key.from_path('CumulRep', board_name or 'legitboard')

def user_key(board_name=None):   
       return db.Key.from_path('RepUsers', board_name or 'legitboard')

class RegisterUser(webapp.RequestHandler):
    def get(self):
        callback = self.request.get('callback')
        output = callback + '({'
        self.response.out.write(output)
        ip = str(self.request.remote_addr)
        board = self.request.get('board')
        newuser = RepUsers(parent=user_key(board))
        newuser.user = self.request.get('user')
        newuser.password = self.request.get('password')
        newuser.board = board
        #pickUser = memcache.get(newuser.user,namespace=board,for_cas=True)
        ipCheck = memcache.get(ip,namespace=board,for_cas=True)
        if ipCheck:
            self.response.out.write('"error": "IP already used. Wait 3 minutes and try again."')
        #if pickUser:
            #self.response.out.write('"error": "Already Registered"')
        else:
            selection = db.GqlQuery("SELECT * "
                                "FROM RepUsers "
                                "WHERE ANCESTOR IS :1 AND user = :2 "
                                "LIMIT 1",
                                user_key(board), newuser.user)
            if selection.get():
                self.response.out.write('"error": "Already Registered"')
            else:
                newuser.put()
                #memcache.set(newuser.user, newuser.password, namespace=board)
                memcache.set(ip, True, time=180, namespace=board)
                self.response.out.write('"success": "true", "user": "'+newuser.user+'"')
        self.response.out.write('})') 

class WorkMem(webapp.RequestHandler):
    def get(self):
            memcache.flush_all()       
            
class AddRep(webapp.RequestHandler):
    def get(self):
        guestbook_name = self.request.get('board')
        password = self.request.get('password')
        greeting = Reputation(parent=reputation_key(guestbook_name))
        greeting.repper = self.request.get('repper')
        greeting.repped = self.request.get('repped')
        greeting.reason = self.request.get('reason')
        greeting.reppername = self.request.get('reppername')
        greeting.amount = self.request.get('amount')
        greeting.board = self.request.get('board')
        if greeting.repper != greeting.repped:
            callback = self.request.get('callback')
            output = callback + '({'
            self.response.out.write(output)
            #pickUser = memcache.get(greeting.repper,namespace=guestbook_name,for_cas=True)
            #if not pickUser:
            if True == True:
                passwordSelect = db.GqlQuery("SELECT * "
                                "FROM RepUsers "
                                "WHERE ANCESTOR IS :1 AND user = :2 "
                                "LIMIT 1",
                                user_key(guestbook_name), greeting.repper)
                if passwordSelect.get():
                    for mrepp in passwordSelect:
                        passwordtest = mrepp.password
                else:
                    self.response.out.write('"Response": "not registered"')
                    self.response.out.write('})')
                    return
            else:
                passwordtest = pickUser
            if passwordtest == password:
                selection = db.GqlQuery("SELECT * "
                                    "FROM Reputation "
                                    "WHERE ANCESTOR IS :1 AND repper = :2 AND repped = :3 "
                                    "ORDER BY date DESC LIMIT 1",
                                    reputation_key(guestbook_name), greeting.repper, greeting.repped)
                if selection.get():
                    for mrep in selection:
                        dater = time.mktime(mrep.date.utctimetuple()) * 1000
                        dater += getattr(mrep.date, 'microseconds', 0) / 1000
                        ms = time.mktime(greeting.date.utctimetuple()) * 1000
                        ms += getattr(greeting.date, 'microseconds', 0) / 1000
                        if (ms-dater) < 86400000:
                            self.response.out.write('"Response": "short",')
                            self.response.out.write('"how": "'+str((86400000-(ms-dater))/3600000)+'"')
                        else:
                            greeting.put()
                            namer = self.request.get('repped')
                            givings = CumulRep.get(cumul_key(namer))
                            cumul = CumulRep(key_name=namer)
                            cumul.repped = namer
                            cumul.board = self.request.get('board')
                            cumul.total = int(self.request.get('amount'))
                            if givings:
                                cumul.total += givings.total
                            cumul.put()
                            memcache.set(cumul.repped, cumul.total, namespace=cumul.board)
                            self.response.out.write('"Response": "success"')
                else:
                    greeting.put()
                    namer = self.request.get('repped')
                    givings = CumulRep.get(cumul_key(namer))
                    cumul = CumulRep(key_name=namer)
                    cumul.repped = namer
                    cumul.board = self.request.get('board')
                    cumul.total = int(self.request.get('amount'))
                    if givings:
                        cumul.total += givings.total
                    cumul.put()
                    memcache.set(cumul.repped, cumul.total, namespace=cumul.board)
                    self.response.out.write('"Response": "success"')
            else:
                self.response.out.write('"Response": "wrong password"')
            self.response.out.write('})')

class GetRep(webapp.RequestHandler):
    def get(self):
        #guestbook_name=self.request.get('board')
        who=self.request.get_all('repped')
        boards = self.request.get('board')
        callback = self.request.get('callback')
        output = callback + '({"Reputation":[\n'
        self.response.out.write(output)
        gillins = memcache.get_multi(who,namespace=boards,for_cas=True)
        for mrep in who:
            if gillins.get(mrep):
                    self.response.out.write('{"amount": "'+str(gillins.get(mrep))+'", "repped": "'+mrep+'"}')
                    self.response.out.write(',')
                    self.response.out.write('\n')
            else:
                greetings = CumulRep.get(cumul_key(mrep))
                if greetings:
                    if greetings.board==boards:
                        self.response.out.write('{"amount": "'+str(greetings.total)+'", "repped": "'+greetings.repped+'"}')
                        self.response.out.write(',')
                        self.response.out.write('\n')
                        memcache.set(mrep, greetings.total, namespace=boards)
                    else:
                        self.response.out.write('{"amount": "0", "repped": "'+mrep+'"}')
                        self.response.out.write(',')
                        self.response.out.write('\n')
                        memcache.set(mrep, "0", namespace=boards)   
                else:
                    self.response.out.write('{"amount": "0", "repped": "'+mrep+'"}')
                    self.response.out.write(',')
                    self.response.out.write('\n')
                    memcache.set(mrep, "0", namespace=boards)    
        newoutput = '{"amount":"0","repped":"219823"}]\n})'
        self.response.out.write(newoutput)

class GetHistory(webapp.RequestHandler):
    def get(self):
        who=self.request.get('repped')
        boards = self.request.get('board')
        callback = self.request.get('callback')
        output = callback + '({"Reputation":[\n'
        self.response.out.write(output)
        selection = db.GqlQuery("SELECT * "
                                "FROM Reputation "
                                "WHERE ANCESTOR IS :1 AND repped = :2 "
                                "ORDER BY date DESC LIMIT 10",
                                reputation_key(boards), who)
        if selection.get():
            for mrep in selection:
                reason = string.replace(mrep.reason, '"',"'")
                reason = string.replace(reason, '"', "'")
                reason = string.replace(reason, "%22", "'")
                reason = string.replace(reason, "\\", "\\\\")
                #dater = mrep.date
                dater = time.mktime(mrep.date.utctimetuple()) * 1000
                dater += getattr(mrep.date, 'microseconds', 0) / 1000
                self.response.out.write('{"reppername": "'+mrep.reppername+'", "amount": "'+str(mrep.amount)+'", "reason": "'+reason+'", "date": "'+str(dater)+'"}')
                self.response.out.write(',')
                self.response.out.write('\n')    
        newoutput = '{"amount":"0","repped":"219823"}]\n})'
        self.response.out.write(newoutput)

class Admin(webapp.RequestHandler):
    def get(self):
        hello = "x"
               
application = webapp.WSGIApplication([
  ('/addrep', AddRep),
  ('/getrep', GetRep),
  ('/gethistory', GetHistory),
  ('/register', RegisterUser),
  ('/flush', WorkMem)
], debug=True)


def main():
    run_wsgi_app(application)


if __name__ == '__main__':
    main()
