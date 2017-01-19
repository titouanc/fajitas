from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import DB_URL


engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
Base = declarative_base(bind=engine)


class SavedFractal(Base):
    __tablename__ = 'fractals'

    id = Column(Integer, primary_key=True)
    name = Column(String(256))
    state = Column(String(4096))

    def as_dict(self):
        return {'id': self.id, 'name': self.name, 'state': self.state}


def add_fractal(name, state):
    sess = Session()
    sess.add(SavedFractal(name=name, state=state))
    sess.commit()


def get_all_fractals():
    return map(SavedFractal.as_dict, Session().query(SavedFractal).all())


Base.metadata.create_all()
